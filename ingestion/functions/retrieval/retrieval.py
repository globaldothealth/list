import codecs
import io
import mimetypes
import os
import re
import sys
import tempfile
import zipfile
import importlib
from chardet import detect
from pathlib import Path

import boto3
import requests

from datetime import datetime, timezone

TEMP_PATH = "/tmp"
ENV_FIELD = "env"
OUTPUT_BUCKET = "epid-sources-raw"
SOURCE_ID_FIELD = "sourceId"
PARSING_DATE_RANGE_FIELD = "parsingDateRange"
TIME_FILEPART_FORMAT = "/%Y/%m/%d/%H%M/"
READ_CHUNK_BYTES = 2048
HEADER_CHUNK_BYTES = 1024 * 1024
CSV_CHUNK_BYTES = 2 * 1024 * 1024

s3_client = boto3.client("s3")

if os.environ.get("DOCKERIZED"):
    s3_client = boto3.client("s3",
        endpoint_url=os.environ.get("AWS_ENDPOINT", "http://localstack:4566"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
        region_name=os.environ.get("AWS_REGION", "us-east-1")
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
            os.pardir, 'common'))
    import common_lib


def extract_event_fields(event):
    print('Extracting fields from event', event)
    if any(
            field not in event
            for field
            in [ENV_FIELD, SOURCE_ID_FIELD]):
        error_message = (
            f"Required fields {ENV_FIELD}; {SOURCE_ID_FIELD} not found in input event: {event}")
        print(error_message)
        raise ValueError(error_message)
    return event[ENV_FIELD], event[SOURCE_ID_FIELD], event.get(
        PARSING_DATE_RANGE_FIELD), event.get(
        'auth', {})


def get_source_details(env, source_id, upload_id, api_headers, cookies):
    """
    Retrieves the content URL and format associated with the provided source ID.
    """
    try:
        source_api_endpoint = f"{common_lib.get_source_api_url(env)}/sources/{source_id}"
        print(f"Requesting source configuration from {source_api_endpoint}")
        r = requests.get(source_api_endpoint,
                         headers=api_headers, cookies=cookies)
        if r and r.status_code == 200:
            api_json = r.json()
            print(f"Received source API response: {api_json}")
            return api_json["origin"]["url"], api_json["format"], api_json.get(
                "automation", {}).get(
                "parser", {}).get(
                "awsLambdaArn", ""), api_json.get(
                'dateFilter', {})
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
    print(f'Guessing mimetype of {url}')
    mimetype, _ = mimetypes.guess_type(url)
    if mimetype == "application/zip":
        print('File seems to be a zip file, decompressing it now')
        # Writing the zip file to temp dir.
        fd, temp_name = tempfile.mkstemp(dir=tempdir)
        with os.fdopen(fd, 'wb') as temp:
            temp.write(content)
            temp.flush()
            # Opening the zip file, extracting its first file.
            with zipfile.ZipFile(temp_name, "r") as zf:
                for name in zf.namelist():
                    with zf.open(name) as f:
                        return io.BytesIO(f.read())
    elif not mimetype:
        print('Could not determine mimetype')
    return io.BytesIO(content)


def retrieve_content(
        env, source_id, upload_id, url, source_format, api_headers, cookies, chunk_bytes=CSV_CHUNK_BYTES, tempdir=TEMP_PATH):
    """ Retrieves and locally persists the content at the provided URL. """
    try:
        if (
            source_format != "JSON"
            and source_format != "CSV"
            and source_format != "XLSX"):
            e = ValueError(f"Unsupported source format: {source_format}")
            common_lib.complete_with_error(
                e, env, common_lib.UploadError.SOURCE_CONFIGURATION_ERROR,
                source_id, upload_id, api_headers, cookies)
        print(f"Downloading {source_format} content from {url}")
        if url.startswith('s3://'):
            # strip the prefix
            s3Location = url[5:]
            # split at the first /
            [s3Bucket, s3Key] = s3Location.split('/', 1)
            # get it!
            content = s3_client.get_object(Bucket=s3Bucket, Key=s3Key)['Body'].read()
        else:
            headers = {"user-agent": "GHDSI/1.0 (http://ghdsi.org)"}
            r = requests.get(url, headers=headers)
            r.raise_for_status()
            content = r.content
        print('Download finished')

        key_filename_part = f"content.{source_format.lower()}"
        # Lambda limitations: 512MB ephemeral disk space.
        # Memory range is from 128 to 3008 MB so we could switch to
        # https://docs.python.org/3/library/io.html#io.StringIO for bigger
        # sources.
        # Make the encoding of retrieved content consistent (UTF-8) for all
        # parsers as per https://github.com/globaldothealth/list/issues/867.
        bytesio = raw_content(url, content, tempdir)
        print('detecting encoding of retrieved content.')
        # Read 2MB to be quite sure about the encoding.
        detected_enc = detect(bytesio.read(2 << 20))
        bytesio.seek(0)
        print(f'Source encoding is presumably {detected_enc}')
        fd, outfile_name = tempfile.mkstemp(dir=tempdir)
        with os.fdopen(fd, "w", encoding='utf-8') as outfile:
            text_stream = codecs.getreader(detected_enc['encoding'])(bytesio)
            # Write the output file as utf-8 in chunks because decoding the
            # whole data in one shot becomes really slow with big files.
            content = text_stream.read(READ_CHUNK_BYTES)
            while content:
                outfile.write(content)
                content = text_stream.read(READ_CHUNK_BYTES)
            s3_object_key = (
                f"{source_id}"
                f"{datetime.now(timezone.utc).strftime(TIME_FILEPART_FORMAT)}"
                f"{key_filename_part}")
            return [(outfile_name, s3_object_key)]
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
        cookies):
    try:
        s3_client.upload_file(
            file_name, OUTPUT_BUCKET, s3_object_key)
        print(
            f"Uploaded source content to s3://{OUTPUT_BUCKET}/{s3_object_key}")
        os.unlink(file_name)
    except Exception as e:
        common_lib.complete_with_error(
            e, env, common_lib.UploadError.INTERNAL_ERROR, source_id, upload_id,
            api_headers, cookies)


def invoke_parser(
    env, parser_module, source_id, upload_id, api_headers, cookies, s3_object_key,
        source_url, date_filter, parsing_date_range):
    payload = {
        "env": env,
        "s3Bucket": OUTPUT_BUCKET,
        "sourceId": source_id,
        "s3Key": s3_object_key,
        "sourceUrl": source_url,
        "uploadId": upload_id,
        "dateFilter": date_filter,
        "dateRange": parsing_date_range,
    }
    print(f"Invoking parser ({parser_module})")
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
    """
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
    return url


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

    env = os.environ['EPID_INGESTION_ENV']
    source_id = os.environ['EPID_INGESTION_SOURCE_ID']
    parsing_date_range = os.getenv('EPID_INGESTION_PARSING_DATE_RANGE', {})
    if isinstance(parsing_date_range, str):  # date range specified with comma
        parsing_date_range = dict(zip(["start", "end"], parsing_date_range.split(",")))
    local_auth = os.getenv('EPID_INGESTION_AUTH', {})

    auth_headers = None
    cookies = None
    if local_auth and env == 'local':
        cookies = common_lib.login(local_auth['email'])
    else:
        auth_headers = common_lib.obtain_api_credentials(s3_client)
    upload_id = common_lib.create_upload_record(
        env, source_id, auth_headers, cookies)
    url, source_format, parser, date_filter = get_source_details(
        env, source_id, upload_id, auth_headers, cookies)
    url = format_source_url(url)
    file_names_s3_object_keys = retrieve_content(
        env, source_id, upload_id, url, source_format, auth_headers, cookies, tempdir=tempdir)
    for file_name, s3_object_key in file_names_s3_object_keys:
        upload_to_s3(file_name, s3_object_key, env,
                     source_id, upload_id, auth_headers, cookies)
    if parser:
        for _, s3_object_key in file_names_s3_object_keys:
            parser_module = common_lib.get_parser_module(parser)
            invoke_parser(
                env, parser_module,
                source_id, upload_id, auth_headers, cookies,
                s3_object_key, url, date_filter, parsing_date_range)
    return {
        "bucket": OUTPUT_BUCKET,
        "key": s3_object_key,
        "upload_id": upload_id,
    }


if __name__ == "__main__":
    run_retrieval(tempdir=(TEMP_PATH if len(sys.argv) == 1 else sys.argv[1]))
