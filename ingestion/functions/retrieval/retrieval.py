import codecs
import re
import io
import mimetypes
import os
import sys
import tempfile
import operator
import subprocess
import importlib
import time
import logging
import dateutil.parser
from chardet import detect
from pathlib import Path

import boto3
import requests

from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)
logger.setLevel("INFO")

TEMP_PATH = "/tmp"
ENV_FIELD = "env"
OUTPUT_BUCKET = "gdh-sources"
SOURCE_ID_FIELD = "sourceId"
PARSING_DATE_RANGE_FIELD = "parsingDateRange"
TIME_FILEPART_FORMAT = "/%Y/%m/%d/%H%M/"
DEFAULT_ENCODING = 'utf-8'
READ_CHUNK_BYTES = 2048
HEADER_CHUNK_BYTES = 1024 * 1024
CSV_CHUNK_BYTES = 2 * 1024 * 1024
IN_PROGRESS_STATUS = ['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING']

s3_client = boto3.client("s3")

if os.environ.get("DOCKERIZED"):
    s3_client = boto3.client("s3",
        endpoint_url=os.environ.get("AWS_ENDPOINT", "https://localhost.localstack.cloud:4566"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
        region_name=os.environ.get("AWS_REGION", "eu-central-1")
    )

# Layer code, like common_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
try:
    import common_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, "common"))
    import common_lib


def extract_event_fields(event):
    logger.info(f"Extracting fields from event {event}")
    if any(
            field not in event
            for field
            in [ENV_FIELD, SOURCE_ID_FIELD]):
        error_message = (
            f"Required fields {ENV_FIELD}; {SOURCE_ID_FIELD} not found in input event: {event}")
        logger.error(error_message)
        raise ValueError(error_message)
    return event[ENV_FIELD], event[SOURCE_ID_FIELD], event.get(
        PARSING_DATE_RANGE_FIELD), event.get(
        "auth", {})


def get_source_details(env, source_id, upload_id, api_headers, cookies):
    """
    Retrieves the content URL and format associated with the provided source ID.
    """
    try:
        source_api_endpoint = f"{common_lib.get_source_api_url(env)}/sources/{source_id}"
        logging.info(f"Requesting source configuration from {source_api_endpoint}")
        r = requests.get(source_api_endpoint,
                         headers=api_headers, cookies=cookies)
        if r and r.status_code == 200:
            api_json = r.json()
            logging.info(f"Received source API response: {api_json}")
            return api_json["origin"]["url"], api_json["format"], api_json.get(
                "automation", {}).get(
                "parser", {}).get(
                "awsLambdaArn", ""), api_json.get(
                "dateFilter", {}), api_json.get(
                "hasStableIdentifiers", False), api_json.get(
                "uploads", {})
        upload_error = (
            common_lib.UploadError.SOURCE_CONFIGURATION_NOT_FOUND
            if r.status_code == 404 else common_lib.UploadError.INTERNAL_ERROR)
        e = RuntimeError(
            f"Error retrieving source details, status={r.status_code}, response={r.text}")
        common_lib.complete_with_error(
            e, env, upload_error, source_id, upload_id,
            api_headers, cookies)
    except ValueError as e:
        common_lib.complete_with_error(
            e, env, common_lib.UploadError.INTERNAL_ERROR, source_id, upload_id,
            api_headers, cookies)


def raw_content(url: str, content: bytes, tempdir: str = TEMP_PATH) -> io.BytesIO:
    # Detect the mimetype of a given URL.
    logger.info(f"Guessing mimetype of {url}")
    mimetype, _ = mimetypes.guess_type(url)
    if mimetype == "application/zip":
        logger.info("File seems to be a zip file, decompressing it now")
        # Writing the zip file to temp dir.
        with tempfile.NamedTemporaryFile(dir=tempdir, delete=False) as f:
            f.write(content)
            f.flush()
        with tempfile.TemporaryDirectory(dir=tempdir) as xf:
            # extract into temporary folder using unzip
            try:
                subprocess.run(["/usr/bin/unzip", "-d", xf, f.name], check=True)
                largest_file = max(
                    ((f, f.stat().st_size) for f in Path(xf).iterdir()
                     if f.is_file()),
                    key=operator.itemgetter(1)
                )[0]
                return largest_file.open("rb")
            except subprocess.CalledProcessError as e:
                raise ValueError(f"Error in extracting zip file with exception:\n{e}")
        Path(f.name).unlink(missing_ok=True)
    elif not mimetype:
        logger.warning("Could not determine mimetype")
    return io.BytesIO(content)


def raw_content_fileconvert(url: str, local_filename: str, tempdir: str = TEMP_PATH) -> str:
    """Convert file to UTF-8 (and decompress) as needed

    Whereas raw_content takes a binary stream as input, this function takes a
    a filename on the local system and returns another filename"""
    # Detect the mimetype of a given URL.
    logger.info(f"Guessing mimetype of {url}")
    mimetype, _ = mimetypes.guess_type(url)
    if mimetype == "application/zip":
        logger.info("File seems to be a zip file, decompressing it now")
        xf = tempfile.mkdtemp(dir=tempdir)
        # extract into temporary folder using unzip
        try:
            subprocess.run(["/usr/bin/unzip", "-d", xf, local_filename], check=True)
            largest_file = max(
                ((f, f.stat().st_size) for f in Path(xf).iterdir()
                 if f.is_file()),
                key=operator.itemgetter(1)
            )[0]
            return '/'.join([xf, largest_file.name])
        except subprocess.CalledProcessError as e:
            raise ValueError(f"Error in extracting zip file with exception:\n{e}")
    elif not mimetype:
        logger.warning("Could not determine mimetype")
    return local_filename


def download_file_stream(url: str, headers: dict, tempdir: str,
                         reps: int = 5, sleeptime: float = 30.,
                         chunk_bytes: int = CSV_CHUNK_BYTES) -> str:
    """Download file as stream checking filesize and retrying (if able)"""
    for _ in range(reps):
        # stream from source to avoid MemoryError for very large (>10Gb) files
        fd, local_filename = tempfile.mkstemp(dir=tempdir)
        with requests.get(url, headers=headers, stream=True) as r:
            r.raise_for_status()
            # check if filesize reported and validate download if possible
            expected_size = int(r.headers["content-length"]
                             if "content-length" in r.headers.keys()
                            else 0)
            logger.info(f"Starting file download, expected size: {expected_size}")
            with os.fdopen(fd, 'wb') as f:
                for chunk in r.iter_content(chunk_size=chunk_bytes):
                    if chunk:
                        f.write(chunk)
                f.flush()
        # confirm download completed successfully
        received_size = os.path.getsize(local_filename)
        if expected_size == 0 or received_size >= expected_size:
            return local_filename
        logger.info(f"File download incomplete (expected {expected_size} got {received_size})")
        logger.info(f"Sleeping for {sleeptime} secs...")
        os.remove(local_filename)
        time.sleep(sleeptime)
    raise requests.exceptions.RequestException("File download failed.")


def generate_deltas(latest_filename: str, uploads: dict, s3_bucket: str,
                  source_id: str, source_format: str) -> str:
    """Check last valid ingestion and return filename of deltas

    If the previous successful ingestion cannot be reconciled with the most
    recent source then abandon the deltas and ingest the full dataset.

    Be wary that batch processes may be active, and should be checked
    before resolving the delta file.
    """
    logger.info("Deltas: Attempting to generate ingestion deltas file...")
    reject_deltas = None, None
    if source_format != 'CSV':
        logger.info(f"Deltas: upsupported filetype ({source_format}) for deltas generation")
        return reject_deltas
    snapshot_ingestion_queue = False
    if snapshot_ingestion_queue:
        # snapshot ingestion-queue for active processes
        logger.info("Deltas: Snapshot batch processes")
        batch_client = boto3.client("batch")
        jobs = []
        for jobStatus in IN_PROGRESS_STATUS:
            r = batch_client.list_jobs(
                jobQueue='ingestion-queue',
                jobStatus=jobStatus)
            jobs.append(*r['jobSummaryList'])
        # TODO: Ensure no source_id relevant processes are cued or running
        if False:
            source_name = ''     # TODO: ###################### GET SOURCE NAME ###
            if filter(lambda x: x['jobName'].startswith(
                f'{source_name}-{source_name}-ingestor'), jobs):
                logger.info("Deltas: Ongoing batch jobs relating to source found. Abandoning deltas generation.")
            return reject_deltas
    # identify last good ingestion source
    if not (last_successful_ingest := list(filter(
            lambda x: x['status'] == 'SUCCESS', uploads))):
        logger.info("Deltas: No previous successful ingestions found.")
        return reject_deltas
    last_successful_ingest = last_successful_ingest[-1]
    d = dateutil.parser.parse(last_successful_ingest['created'])
    # ensure no rejected deltas exist after the initial successful bulk upload
    # as this would desynchronise the database; if so, revert to bulk ingestion
    uploads.sort(key=lambda x: x["created"], reverse=False)  # chronological
    if not (bulk_ingestion := list(filter(
            lambda x: (x['status'] == 'SUCCESS')
            and (('deltas' not in x) or (x['deltas'] is None)),
            uploads))):
        logger.info("Deltas: Cannot identify last successful bulk upload")
        return reject_deltas
    if list(filter(
            lambda x: ('deltas' in x) and x['deltas']
            and ('accepted' in x) and not x['accepted'],
            uploads[uploads.index(bulk_ingestion[0]) + 1:])):
        logger.info("Deltas: rejected deltas identified in upload history, "
                "abandoning deltas generation")
        return reject_deltas
    # retrieve last good ingestion source
    _, last_ingested_file_name = tempfile.mkstemp()
    s3_key = f"{source_id}{d.strftime(TIME_FILEPART_FORMAT)}content.csv"
    logger.info(f"Deltas: Identified last good ingestion source at: {s3_bucket}/{s3_key}")
    s3_client.download_file(s3_bucket, s3_key, last_ingested_file_name)
    logger.info(f"Deltas: Retrieved last good ingestion source: {last_ingested_file_name}")
    # confirm that headers match and copy header line to the new deltas file
    #  that will serve as the input source
    with open(last_ingested_file_name, "r") as last_ingested_file:
        last_ingested_header = last_ingested_file.readline()
    with open(latest_filename, "r") as lastest_file:
        latest_header = lastest_file.readline()
    if latest_header != last_ingested_header:
        logger.info("Deltas: Headers do not match - abandoning deltas")
        return reject_deltas
    # generate deltas files (additions and removals) with correct headers
    try:
        # generate additions file (or return filename: None)
        fd, deltas_add_file_name = tempfile.mkstemp()
        initial_file_size = 0
        with os.fdopen(fd, "w") as deltas_add_file:
            deltas_add_file.writelines(latest_header)
            intial_file_size = deltas_add_file.tell()
        deltas_add_file.close()
        deltas_add_file = open(deltas_add_file_name, "a")
        if subprocess.run(["/usr/bin/env",
                           "comm",
                           "-13",  # Suppress unique lines from file1 and common
                           last_ingested_file_name,
                           latest_filename,
                           '--nocheck-order'],
                          stdout=deltas_add_file).returncode > 0:
            logger.error("Deltas: second comm command returned an error code")
            return reject_deltas
        if deltas_add_file.tell() == initial_file_size:
            deltas_add_file_name = None
        deltas_add_file.close()
        # generate removals file (or return filename: None)
        fd, deltas_del_file_name = tempfile.mkstemp()
        initial_file_size = 0
        with os.fdopen(fd, "w") as deltas_del_file:
            deltas_del_file.writelines(latest_header)
            initial_file_size = deltas_del_file.tell()
        deltas_del_file = open(deltas_del_file_name, "a")
        if subprocess.run(["/usr/bin/env",
                           "comm",
                           "-23",  # Suppress unique lines from file2 and common
                           last_ingested_file_name,
                           latest_filename,
                           '--nocheck-order'],
                          stdout=deltas_del_file).returncode > 0:
            logger.error("Deltas: first comm command returned an error code")
            return reject_deltas
        if deltas_del_file.tell() == initial_file_size:
            deltas_del_file_name = None
        deltas_del_file.close()
    except subprocess.CalledProcessError as e:
        logger.error(f"Deltas: Process error during call to comm command: {e}")
        return reject_deltas
    return deltas_add_file_name, deltas_del_file_name


def retrieve_content(env, source_id, upload_id, url, source_format,
                     api_headers, cookies, chunk_bytes=CSV_CHUNK_BYTES,
                     tempdir=TEMP_PATH, uploads_history={},
                     bucket=OUTPUT_BUCKET):
    """ Retrieves and locally persists the content at the provided URL. """
    try:
        if (source_format != "JSON"
                and source_format != "CSV"
                and source_format != "XLSX"):
            e = ValueError(f"Unsupported source format: {source_format}")
            common_lib.complete_with_error(
                e, env, common_lib.UploadError.SOURCE_CONFIGURATION_ERROR,
                source_id, upload_id, api_headers, cookies)
        logger.info(f"Downloading {source_format} content from {url}")
        if url.startswith("s3://"):
            # strip the prefix
            s3Location = url[5:]
            # split at the first /
            [s3Bucket, s3Key] = s3Location.split('/', 1)
            # get it!
            _, local_filename = tempfile.mkstemp(dir=tempdir)
            s3_client.download_file(s3Bucket, s3Key, local_filename)
        else:
            headers = {"user-agent": "GHDSI/1.0 (https://global.health)"}
            local_filename = download_file_stream(url, headers, tempdir)
        logger.info("Download finished")

        key_filename_part = f"content.{source_format.lower()}"
        s3_object_key = (
            f"{source_id}"
            f"{datetime.now(timezone.utc).strftime(TIME_FILEPART_FORMAT)}"
            f"{key_filename_part}"
        )
        # Make the encoding of retrieved content consistent (UTF-8) for all
        # parsers as per https://github.com/globaldothealth/list/issues/867.
        bytes_filename = raw_content_fileconvert(url, local_filename, tempdir)
        logging.info(f"Filename after conversion: {bytes_filename}")
        if source_format == "XLSX":
            # do not convert XLSX into another encoding, leave for parsers
            logger.warning("Skipping encoding detection for XLSX")
            outfile = bytes_filename
        else:
            logger.info("Detecting encoding of retrieved content")
            # Read 2MB to be quite sure about the encoding.
            bytesio = open(bytes_filename, "rb")
            detected_enc = detect(bytesio.read(2 << 20))
            bytesio.seek(0)
            if detected_enc["encoding"]:
                logger.info(f"Source encoding is presumably {detected_enc}")
            else:
                detected_enc["encoding"] = DEFAULT_ENCODING
                logger.warning(f"Source encoding detection failed, setting to {DEFAULT_ENCODING}")
            fd, outfile_name = tempfile.mkstemp(dir=tempdir)
            with os.fdopen(fd, "w", encoding="utf-8") as outfile:
                text_stream = codecs.getreader(detected_enc["encoding"])(bytesio)
                # Write the output file as utf-8 in chunks because decoding the
                # whole data in one shot becomes really slow with big files.
                content = text_stream.read(READ_CHUNK_BYTES)
                while content:
                    outfile.write(content)
                    content = text_stream.read(READ_CHUNK_BYTES)
        # always return full source file (but don't necessarily parse it)
        return_list = [(outfile_name, s3_object_key, {})]
        # attempt to generate deltas file
        deltas_add_file_name, deltas_del_file_name = generate_deltas(
            outfile_name,
            uploads_history,
            bucket,
            source_id,
            source_format,
        )
        if deltas_add_file_name:
            s3_deltas_add_object_key = (
                f"{source_id}"
                f"{datetime.now(timezone.utc).strftime(TIME_FILEPART_FORMAT)}"
                f"deltasAdd.{source_format.lower()}"
            )
            logger.info(f"Delta file (ADD): f{deltas_add_file_name}")
            return_list[0][2]['parseit'] = False
            return_list.append((deltas_add_file_name,
                                s3_deltas_add_object_key,
                                {'deltas': "Add"}))
        if deltas_del_file_name:
            s3_deltas_del_object_key = (
                f"{source_id}"
                f"{datetime.now(timezone.utc).strftime(TIME_FILEPART_FORMAT)}"
                f"deltasDel.{source_format.lower()}"
            )
            logger.info(f"Delta file (DEL): {deltas_del_file_name}")
            return_list[0][2]['parseit'] = False
            return_list.append((deltas_del_file_name,
                                s3_deltas_del_object_key,
                                {'deltas': "Del"}))
        return return_list
    except requests.exceptions.RequestException as e:
        upload_error = (
            common_lib.UploadError.SOURCE_CONTENT_NOT_FOUND
            if e.response.status_code == 404 else
            common_lib.UploadError.SOURCE_CONTENT_DOWNLOAD_ERROR)
        common_lib.complete_with_error(
            e, env, upload_error, source_id, upload_id,
            api_headers, cookies)


def upload_to_s3(
        file_name, s3_object_key, env, source_id, upload_id, api_headers,
        cookies, bucket=OUTPUT_BUCKET):
    try:
        s3_client.upload_file(
            file_name, bucket, s3_object_key)
        logger.info(
            f"Uploaded source content to s3://{bucket}/{s3_object_key}")
        os.unlink(file_name)
    except Exception as e:
        common_lib.complete_with_error(
            e, env, common_lib.UploadError.INTERNAL_ERROR, source_id, upload_id,
            api_headers, cookies)


def invoke_parser(
    env, parser_module, source_id, upload_id, api_headers, cookies, s3_object_key,
        source_url, date_filter, parsing_date_range, deltas=None):
    auth = {"email": os.getenv("EPID_INGESTION_EMAIL", "")} if cookies else None
    payload = {
        "env": env,
        "s3Bucket": OUTPUT_BUCKET,
        "sourceId": source_id,
        "s3Key": s3_object_key,
        "sourceUrl": source_url,
        "uploadId": upload_id,
        "dateFilter": date_filter,
        "dateRange": parsing_date_range,
        "auth": auth,
        "deltas": deltas,
    }
    logger.info(f"Invoking parser ({parser_module})")
    sys.path.append(str(Path(__file__).parent.parent))  # ingestion/functions
    importlib.import_module(parser_module).event_handler(payload)


def get_today():
    """Return today's datetime, just here for easier mocking."""
    return datetime.today()


def format_source_url(url: str) -> str:
    """
    Formats the given url with the date formatting params contained in it if any.
    - $FULLYEAR is replaced with the 4 digits current year.
    - $FULLMONTH is replaced with the 2 digits current month.
    - $FULLDAY is replaced with the 2 digits current day of the month.
    - $MONTH is replaced with the 1 or 2 digits current month.
    - $DAY is replaced with the 1 or 2 digits current day of the month.

    A suffix of ::daysbefore=N can be used to offset the current date by N days
    in the past before substitution
    """
    urlmatch = re.match(r'(.*)::daysbefore=(.*)', url)
    if urlmatch and len(urlmatch.groups()) == 2 and urlmatch.groups()[1].isdigit():
        today = get_today() - timedelta(days=int(urlmatch.groups()[1]))
    else:
        today = get_today()
    mappings = {
        "$FULLYEAR": str(today.year),
        "$FULLMONTH": str(today.month).zfill(2),
        "$MONTH": str(today.month),
        "$FULLDAY": str(today.day).zfill(2),
        "$DAY": str(today.day),
    }
    for key in mappings:
        if key in url:
            url = url.replace(key, mappings[key], -1)
    return re.sub(r'(.*)::daysbefore=.*', r'\1', url)


def run_retrieval(tempdir=TEMP_PATH):
    """Global ingestion retrieval function.

    Parameters
    ----------
    event: dict, required
        Input event JSON-as-dict specified by the CloudWatch Event Rule.
        This must contain a `sourceId` field specifying the canonical epid
        system source UUID.
        For more information, see:
          https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html#schedule_event_type

    context: object, required
        Lambda Context runtime methods and attributes.
        For more information, see:
          https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html

    tempdir: str, optional
        Temporary folder to store retrieve content in

    Returns
    ------
    JSON object containing the bucket and key at which the retrieved data was
    uploaded to S3. For more information on return types, see:
      https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    env = os.environ["EPID_INGESTION_ENV"]
    source_id = os.environ["EPID_INGESTION_SOURCE_ID"]
    parsing_date_range = os.getenv("EPID_INGESTION_PARSING_DATE_RANGE", {})
    if isinstance(parsing_date_range, str):  # date range specified with comma
        parsing_date_range = dict(zip(["start", "end"], parsing_date_range.split(",")))
    local_email = os.getenv("EPID_INGESTION_EMAIL", "")

    auth_headers = None
    cookies = None
    if local_email and env in ["local", "locale2e"]:
        cookies = common_lib.login(local_email)
    else:
        auth_headers = common_lib.obtain_api_credentials(s3_client)
    upload_id = common_lib.create_upload_record(
        env, source_id, auth_headers, cookies)
    url, source_format, parser, date_filter, stable_identifiers, uploads_history = get_source_details(
        env, source_id, upload_id, auth_headers, cookies)

    if not stable_identifiers:
        logger.info(f"Source {source_id} does not have stable identifiers\n"
              "Ingesting entire dataset and ignoring date filter and date ranges")
        date_filter = {}
        parsing_date_range = {}
    url = format_source_url(url)
    file_names_s3_object_keys = retrieve_content(
        env, source_id, upload_id, url, source_format, auth_headers, cookies,
        tempdir=tempdir, uploads_history=uploads_history)
    for file_name, s3_object_key, *opts in file_names_s3_object_keys:
        upload_to_s3(file_name, s3_object_key, env,
                     source_id, upload_id, auth_headers, cookies)
    del_upload_id = []
    if parser:
        for _, s3_object_key, *opts in file_names_s3_object_keys:
            # check which files to parse (default: yes); relevant when deltas
            # files are generated, but full source should also be uploaded for
            # future comparisons
            if opts:
                parseit = opts[0]['parseit'] if 'parseit' in opts[0] else True
                deltas = opts[0]['deltas'] if 'deltas' in opts[0] else None
            else:
                parseit = True
                deltas = None
            if parseit:
                parser_module = common_lib.get_parser_module(parser)
                if deltas == "Del":
                    # create new uploadId for Deletes
                    del_upload_id = [common_lib.create_upload_record(
                        env, source_id, auth_headers, cookies)]
                    invoke_parser(
                        env, parser_module, source_id, del_upload_id[0],
                        auth_headers, cookies, s3_object_key, url, date_filter,
                        parsing_date_range, deltas)
                else:
                    invoke_parser(
                        env, parser_module, source_id, upload_id,
                        auth_headers, cookies, s3_object_key, url, date_filter,
                        parsing_date_range, deltas)

    else:
        common_lib.complete_with_error(
            ValueError(f"No parser set for {source_id}"),
            env, common_lib.UploadError.SOURCE_CONFIGURATION_ERROR, source_id, upload_id,
            auth_headers, cookies)

    return {
        "bucket": OUTPUT_BUCKET,
        "key": s3_object_key,
        "upload_id": [upload_id] + del_upload_id,
    }


if __name__ == "__main__":
    run_retrieval(tempdir=(TEMP_PATH if len(sys.argv) == 1 else sys.argv[1]))
