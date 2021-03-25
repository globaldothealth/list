import codecs
import io
import json
import mimetypes
import os
import sys
import tempfile
import zipfile
from chardet import detect

import boto3
import requests

from datetime import datetime, timezone

EFS_PATH = "/mnt/efs"
ENV_FIELD = "env"
OUTPUT_BUCKET = "epid-sources-raw"
SOURCE_ID_FIELD = "sourceId"
PARSING_DATE_RANGE_FIELD = "parsingDateRange"
TIME_FILEPART_FORMAT = "/%Y/%m/%d/%H%M/"
READ_CHUNK_BYTES = 2048
HEADER_CHUNK_BYTES = 1024 * 1024
CSV_CHUNK_BYTES = 2 * 1024 * 1024

lambda_client = boto3.client("lambda", region_name="us-east-1")
s3_client = boto3.client("s3")

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

try:
    import argentina
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/argentina'))
    import argentina

try:
    import acre
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_acre'))
    import acre
try:
    import amapa
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_amapa'))
    import amapa
try:
    import ceara
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_ceara'))
    import ceara
try:
    import distrito_federal
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_distrito_federal'))
    import distrito_federal
try:
    import espirito_santo
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_espirito_santo'))
    import espirito_santo
try:
    import goias
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_goias'))
    import goias
try:
    import para
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_para'))
    import para
try:
    import paraiba
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_paraiba'))
    import paraiba
try:
    import rio_de_janeiro
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_rio_de_janeiro'))
    import rio_de_janeiro
try:
    import santa_catarina
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/brazil_santa_catarina'))
    import santa_catarina
try:
    import canada
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/canada'))
    import canada

try:
    import zurich
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/ch_zurich'))
    import zurich
try:
    import colombia
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/colombia'))
    import colombia
try:
    import cuba
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/cuba'))
    import cuba
try:
    import czechia
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/czechia'))
    import czechia
try:
    import estonia
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/estonia'))
    import estonia
try:
    import germany
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/germany'))
    import germany
try:
    import hongkong
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/hongkong'))
    import hongkong
try:
    import india
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/india'))
    import india
try:
    import japan
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/japan'))
    import japan
try:
    import mexico
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/mexico'))
    import mexico
try:
    import new_zealand
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/new_zealand'))
    import new_zealand
try:
    import paraguay
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/paraguay'))
    import paraguay
try:
    import peru
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/peru'))
    import peru
try:
    import republic_of_korea
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/republic_of_korea'))
    import republic_of_korea
try:
    import riograndedosul
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/riograndedosul'))
    import riograndedosul
try:
    import saopaolo
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/saopaolo'))
    import saopaolo
try:
    import scotland
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/scotland'))
    import scotland

try:
    import south_africa
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/south_africa'))
    import south_africa
try:
    import taiwan
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/taiwan'))
    import taiwan
try:
    import thailand
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/thailand'))
    import thailand
try:
    import USA
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'parsing/USA'))
    import USA

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


def raw_content(url: str, content: bytes, tempdir: str = EFS_PATH) -> io.BytesIO:
    # Detect the mimetype of a given URL.
    print(f'Guessing mimetype of {url}')
    mimetype, _ = mimetypes.guess_type(url)
    if mimetype == "application/zip":
        print('File seems to be a zip file, decompressing it now')
        # Writing the zip file to temp dir.
        with tempfile.NamedTemporaryFile("wb", delete=False, dir=tempdir) as temp:
            temp.write(content)
            temp.flush()
            # Opening the zip file, extracting its first file.
            with zipfile.ZipFile(temp.name, "r") as zf:
                for name in zf.namelist():
                    with zf.open(name) as f:
                        return io.BytesIO(f.read())
    elif not mimetype:
        print('Could not determine mimetype')
    return io.BytesIO(content)


def retrieve_content_csv(
        env, source_id, upload_id, url, api_headers, cookies, chunk_bytes=CSV_CHUNK_BYTES, header=True, tempdir=EFS_PATH):
    """ Retrieves and locally persists the content in CSV format at the provided URL.

    This method chunks the CSV file to avoid timeouts in the ingestion functions.
    Chunking is controlled by the `chunk_bytes` parameter, which defaults to 100 MiB.
    """
    csv_header = None  # Assume no header by default
    try:
        print(f"Downloading CSV content from {url}")
        headers = {"user-agent": "GHDSI/1.0 (http://ghdsi.org)"}
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        print('Download finished')

        key_filename_part = "content.csv"
        # Lambda limitations: 512MB ephemeral disk space.
        # Memory range is from 128 to 3008 MB so we could switch to
        # https://docs.python.org/3/library/io.html#io.StringIO for bigger
        # sources.
        # Make the encoding of retrieved content consistent (UTF-8) for all
        # parsers as per https://github.com/globaldothealth/list/issues/867.
        bytesio = raw_content(url, r.content, tempdir)
        print('detecting encoding of retrieved content.')
        # Read 2MB to be quite sure about the encoding.
        detected_enc = detect(bytesio.read(2 << 20))
        bytesio.seek(0)
        print(f'Source encoding is presumably {detected_enc}')
        Reader = codecs.getreader(detected_enc['encoding'])

        if header:
            header_sample = bytesio.read(HEADER_CHUNK_BYTES)
            if b"\n" not in header_sample:
                # Did not reach newline, which either means
                #
                # (a) there is only the header, and the CSV file is empty
                # (b) the header line itself is larger than 1 MB in size.
                #
                # We assume (b) is not true, and for (a) we return an empty
                # list which will skip uploading to S3 and calling
                # ingestion.
                return []
            header_offset = header_sample.find(b"\n") + 1
            csv_header = header_sample[:header_offset].decode(detected_enc["encoding"])
            bytesio.seek(header_offset)  # skip to first line

        text_stream = Reader(bytesio)
        content = text_stream.read(chunk_bytes)
        chunk_n = 0
        unwritten_chunk = ""
        chunk_s3 = []
        while content:
            lines = content.split("\n")
            with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, dir=tempdir) as outfile:
                if csv_header:
                    outfile.write(csv_header)
                outfile.write(unwritten_chunk + "\n".join(lines[:-1]) + "\n")
                unwritten_chunk = lines[-1]
            s3_object_key = (
                f"{source_id}"
                f"{datetime.now(timezone.utc).strftime(TIME_FILEPART_FORMAT)}"
                f"{key_filename_part}.{chunk_n}")
            chunk_s3.append((outfile.name, s3_object_key))
            chunk_n += 1
            content = text_stream.read(chunk_bytes)

        if unwritten_chunk:
            with codecs.open(outfile.name, "a", 'utf-8') as outfile:
                outfile.write(unwritten_chunk)

        return chunk_s3
    except requests.exceptions.RequestException as e:
        upload_error = (
            common_lib.UploadError.SOURCE_CONTENT_NOT_FOUND
            if e.response.status_code == 404 else
            common_lib.UploadError.SOURCE_CONTENT_DOWNLOAD_ERROR)
        common_lib.complete_with_error(
            e, env, upload_error, source_id, upload_id,
            api_headers, cookies)



def retrieve_content(
        env, source_id, upload_id, url, source_format, api_headers, cookies, chunk_bytes=CSV_CHUNK_BYTES, tempdir=EFS_PATH):
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
        if source_format == "CSV":
            return retrieve_content_csv(env, source_id, upload_id, url,
                                        api_headers, cookies, chunk_bytes=chunk_bytes, tempdir=tempdir)
        print(f"Downloading {source_format} content from {url}")
        headers = {"user-agent": "GHDSI/1.0 (http://ghdsi.org)"}
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        print('Download finished')

        key_filename_part = f"content.{source_format.lower()}"
        # Lambda limitations: 512MB ephemeral disk space.
        # Memory range is from 128 to 3008 MB so we could switch to
        # https://docs.python.org/3/library/io.html#io.StringIO for bigger
        # sources.
        # Make the encoding of retrieved content consistent (UTF-8) for all
        # parsers as per https://github.com/globaldothealth/list/issues/867.
        bytesio = raw_content(url, r.content, tempdir)
        print('detecting encoding of retrieved content.')
        # Read 2MB to be quite sure about the encoding.
        detected_enc = detect(bytesio.read(2 << 20))
        bytesio.seek(0)
        print(f'Source encoding is presumably {detected_enc}')
        with tempfile.NamedTemporaryFile("w", encoding='utf-8', delete=False, dir=tempdir) as outfile:
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
            return [(outfile.name, s3_object_key)]
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
    env, parser_arn, source_id, upload_id, api_headers, cookies, s3_object_key,
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
    print(f"Invoking parser (ARN: {parser_arn})")
    # This is asynchronous due to the "Event" invocation type.
    lambdaFunctionName = parser_arn.split("-")[2];
    print(f"{lambdaFunctionName}")
    country = lambdaFunctionName[:-15]
    print(f"Invoking parser for Country : {country}")

    if country == 'Argentina':
       argentina.lambda_handler(payload)
    elif country == 'BrazilAcre':
       acre.lambda_handler(payload)
    elif country == 'BrazilAmapa':
       amapa.lambda_handler(payload)
    elif country == 'BrazilCeara':
       ceara.lambda_handler(payload)
    elif country == 'BrazilDistritoFederal':
       distrito_federal.lambda_handler(payload)
    elif country == 'BrazilEspiritoSanto':
       espirito_santo.lambda_handler(payload)
    elif country == 'BrazilGoias':
       goias.lambda_handler(payload)
    elif country == 'BrazilPara':
       para.lambda_handler(payload)
    elif country == 'BrazilParaiba':
       paraiba.lambda_handler(payload)
    elif country == 'BrazilRGDS':
       rio_de_janeiro.lambda_handler(payload)
    elif country == 'BrazilRioDeJaneiro':
       rio_de_janeiro.lambda_handler(payload)
    elif country == 'BrazilSantaCatarina':
       santa_catarina.lambda_handler(payload)
    elif country == 'CHZurich':
       zurich.lambda_handler(payload)
    elif country == 'Canada':
       canada.lambda_handler(payload)
    elif country == 'Colombia':
       colombia.lambda_handler(payload)
    elif country == 'Cuba':
       cuba.lambda_handler(payload)  
    elif country == 'Czechia':
       czechia.lambda_handler(payload)
    elif country == 'Estonia':
       estonia.lambda_handler(payload)
    elif country == 'Germany':
       germany.lambda_handler(payload)
    elif country == 'HongKong':
       hongkong.lambda_handler(payload)
    elif country == 'India':
       india.lambda_handler(payload)
    elif country == 'Japan':
       japan.lambda_handler(payload)
    elif country == 'Mexico':
       mexico.lambda_handler(payload)
    elif country == 'NewZealand':
       new_zealand.lambda_handler(payload)
    elif country == 'Paraguay':
       paraguay.lambda_handler(payload)
    elif country == 'Peru':
       peru.lambda_handler(payload)
    elif country == 'RepublicOfKorea':
       republic_of_korea.lambda_handler(payload)  
    elif country == 'SaoPaolo':
       saopaolo.lambda_handler(payload)
    elif country == 'Scotland':
       scotland.lambda_handler(payload)
    elif country == 'SouthAfrica':
       south_africa.lambda_handler(payload)
    elif country == 'Taiwan':
       taiwan.lambda_handler(payload)
    elif country == 'Thailand':
       thailand.lambda_handler(payload)
    elif country == 'USA':
       USA.lambda_handler(payload)
    else:
       print(f"No parser found for  Country : {country}")


    
    # response = lambda_client.invoke(
    #     FunctionName=parser_arn,
    #     InvocationType='Event',
    #     Payload=json.dumps(payload))
    # print(f"Parser response: {response}")
    # if "StatusCode" not in response or response["StatusCode"] != 202:
    #     e = Exception(f"Parser invocation unsuccessful. Response: {response}")
    #     common_lib.complete_with_error(
    #         e, env, common_lib.UploadError.INTERNAL_ERROR, source_id, upload_id,
    #         api_headers, cookies)


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


def lambda_handler(tempdir=EFS_PATH):
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
        Temporary folder to store retrieve content in. Should be /tmp for test runs
        and EFS_PATH for actual runs (the default)

    Returns
    ------
    JSON object containing the bucket and key at which the retrieved data was
    uploaded to S3. For more information on return types, see:
      https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html
    """

    #env, source_id, parsing_date_range, local_auth = extract_event_fields(
    #    event)
    env = os.environ['EPID_INGESTION_ENV']
    source_id = os.environ['EPID_INGESTION_SOURCE_ID']
    parsing_date_range = os.getenv('EPID_INGESTION_PARSING_DATE_RANGE',{})
    local_auth = os.getenv('EPID_INGESTION_AUTH',{})
   
    auth_headers = None
    cookies = None
    if local_auth and env == 'local':
        cookies = common_lib.login(local_auth['email'])
    else:
        auth_headers = common_lib.obtain_api_credentials(s3_client)
    upload_id = common_lib.create_upload_record(
        env, source_id, auth_headers, cookies)
    url, source_format, parser_arn, date_filter = get_source_details(
        env, source_id, upload_id, auth_headers, cookies)
    url = format_source_url(url)
    file_names_s3_object_keys = retrieve_content(
        env, source_id, upload_id, url, source_format, auth_headers, cookies, tempdir=tempdir)
    for file_name, s3_object_key in file_names_s3_object_keys:
        upload_to_s3(file_name, s3_object_key, env,
                     source_id, upload_id, auth_headers, cookies)
    if parser_arn:
        for _, s3_object_key in file_names_s3_object_keys:
            invoke_parser(
                env, parser_arn, source_id, upload_id, auth_headers, cookies,
                s3_object_key, url, date_filter, parsing_date_range)
    return {
        "bucket": OUTPUT_BUCKET,
        "key": s3_object_key,
        "upload_id": upload_id,
    }


if __name__ == "__main__":
    lambda_handler(tempdir=EFS_PATH)

