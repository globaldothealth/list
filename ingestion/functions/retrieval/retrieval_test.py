import boto3
import datetime
import json
import os
import pytest
import tempfile
import sys
import zipfile
import shutil

from enum import Enum
from unittest.mock import MagicMock, patch

SOURCES_BUCKET = "gdh-sources"

try:
    import common_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'common'))
    import common_lib


s3_client = boto3.client(
    "s3",
    endpoint_url=os.environ.get("AWS_ENDPOINT", "http://localhost.localstack.cloud:4566"),
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
    region_name=os.environ.get("AWS_REGION", "eu-central-1")
)

_SOURCE_API_URL = "http://foo.bar"

date_filter = {"numDaysBeforeToday": 2, "op": "EQ"}
origin_url = "http://bar.baz/"
upload_id = "012345678901234567890123"
example_source = {
    "format": "JSON",
    "origin": {"url": origin_url, "license": "MIT"},
    "automation": {"parser": {"awsLambdaArn": "example.example"}},
    "dateFilter": date_filter
}
example_source_stable_ids = {
    **example_source,
    "hasStableIdentifiers": True
}


def create_upload_url(source_id):
    return f"{_SOURCE_API_URL}/sources/{source_id}/uploads"


@pytest.fixture()
def mock_source_api_url_fixture():
    """
    Supplies a predetermined endpoint for G.h HTTP requests.

    Because the retrieval library is imported locally, this fixture can't
    be set to autouse.
    """
    import common_lib  # pylint: disable=import-error
    with patch('common_lib.get_source_api_url') as mock:
        mock.return_value = _SOURCE_API_URL
        yield common_lib


@pytest.fixture()
def setup_e2e(mock_source_api_url_fixture, valid_event, requests_mock):
    source_id = valid_event['sourceId']

    # Mock the request to create the upload.
    requests_mock.post(
        create_upload_url(source_id), json={"_id": upload_id},
        status_code=201)

    # Mock the request to retrieve source content.
    requests_mock.get(origin_url, json={"data": "yes"})

    # Mock/stub retrieving credentials, invoking the parser, and S3.
    common_lib = mock_source_api_url_fixture
    common_lib.obtain_api_credentials = MagicMock(
        name="obtain_api_credentials", return_value={})

    # Set up mock request values used in multiple requests.
    # TODO: Complete removal of URL env var.
    os.environ["EPID_INGESTION_ENV"] = valid_event['env']
    os.environ["EPID_INGESTION_SOURCE_ID"] = valid_event['sourceId']
    os.environ["EPID_INGESTION_PARSING_DATE_RANGE"] = (
        valid_event['parsingDateRange']['start']
        + ","
        + valid_event['parsingDateRange']['end']
    )
    os.environ["SOURCE_API_URL"] = _SOURCE_API_URL
    yield requests_mock, common_lib


@pytest.fixture()
def valid_event():
    """Loads valid CloudWatch ScheduledEvent from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "valid_scheduled_event.json")
    with open(file_path) as event_file:
        return json.load(event_file)


def test_format_url_leaves_unchanged_if_no_format_params():
    from retrieval import retrieval  # Import locally to avoid superseding mock
    url = "http://foo.bar"
    assert retrieval.format_source_url(url) == url


@patch('retrieval.retrieval.get_today')
def test_format_url(mock_today):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 8)
    url = "http://foo.bar/$FULLYEAR-$FULLMONTH-$FULLDAY/$MONTH/$DAY.json"
    assert retrieval.format_source_url(
        url) == "http://foo.bar/2020-06-08/6/8.json"


@patch('retrieval.retrieval.get_today')
def test_format_url_daysbefore(mock_today):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 8)
    url = "http://foo.bar/$FULLYEAR-$FULLMONTH-$FULLDAY/$MONTH/$DAY.json::daysbefore=3"
    assert retrieval.format_source_url(
        url) == "http://foo.bar/2020-06-05/6/5.json"


@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
@pytest.mark.parametrize("source", [example_source_stable_ids, example_source])
def test_e2e(source, valid_event, mock_source_api_url_fixture, setup_e2e, tempdir="/tmp"):
    from retrieval import retrieval
    requests_mock, common_lib = setup_e2e
    print(valid_event)
    source_id = valid_event['sourceId']
    retrieval.invoke_parser = MagicMock(name="invoke_parser")

    # Mock the request to retrieval source details (e.g. format).
    full_source_url = f"{_SOURCE_API_URL}/sources/{source_id}"
    requests_mock.get(full_source_url, json=source)
    has_stable_ids = source.get("hasStableIdentifiers", False)

    response = retrieval.run_retrieval(tempdir=tempdir)

    common_lib.obtain_api_credentials.assert_called_once()
    retrieval.invoke_parser.assert_called_once_with(
        valid_event["env"],
        "parsing.example.example",
        source_id, upload_id, {}, None,
        response["key"],
        origin_url,
        date_filter if has_stable_ids else {},
        valid_event["parsingDateRange"] if has_stable_ids else {},
        None)
    assert requests_mock.request_history[0].url == create_upload_url(source_id)
    assert requests_mock.request_history[1].url == full_source_url
    assert requests_mock.request_history[2].url == origin_url
    assert response["bucket"] == retrieval.OUTPUT_BUCKET
    assert source_id in response["key"]
    assert response["upload_id"][0] == upload_id    # returns a list to support deltas


def test_extract_event_fields_returns_env_source_id_and_date_range(valid_event):
    from retrieval import retrieval
    env, source_id, date_range, _ = retrieval.extract_event_fields(valid_event)
    assert env == valid_event["env"]
    assert source_id == valid_event["sourceId"]
    assert date_range == valid_event["parsingDateRange"]


def test_extract_event_fields_raises_error_if_event_lacks_env():
    from retrieval import retrieval  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=retrieval.ENV_FIELD):
        retrieval.extract_event_fields({"sourceId": "sourceId"})


def test_extract_event_fields_raises_error_if_event_lacks_source_id():
    from retrieval import retrieval  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=retrieval.SOURCE_ID_FIELD):
        retrieval.extract_event_fields({"env": "env"})


def test_get_source_details_returns_url_format_stable_identifiers(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://bar.baz"
    requests_mock.get(f"{_SOURCE_API_URL}/sources/{source_id}",
                      json={"format": "CSV",
                            "origin": {"url": content_url, "license": "MIT"},
                            "hasStableIdentifiers": True
                            })
    result = retrieval.get_source_details(
        "env", source_id, "upload_id", {}, {})
    assert result[0] == content_url
    assert result[1] == "CSV"
    assert result[2] == ""
    assert result[3] == {}
    assert result[4] is True


def test_get_source_details_returns_parser_arn_if_present(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://bar.baz"
    job_def_arn = "testArn"
    requests_mock.get(
        f"{_SOURCE_API_URL}/sources/{source_id}",
        json={"origin": {"url": content_url, "license": "MIT"},
              "format": "JSON",
              "automation": {"parser": {"awsLambdaArn": job_def_arn}}})
    result = retrieval.get_source_details(
        "env", source_id, "upload_id", {}, {})
    assert result[2] == job_def_arn


def test_get_source_details_raises_error_if_source_not_found(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    # TODO: Complete removal of URL env var.
    os.environ["SOURCE_API_URL"] = _SOURCE_API_URL
    source_id = "id"
    get_source_url = f"{_SOURCE_API_URL}/sources/{source_id}"
    requests_mock.get(get_source_url, status_code=404)
    upload_id = "upload_id"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.get_source_details("env", source_id, upload_id, {}, {})
    except Exception:
        assert requests_mock.request_history[0].url == get_source_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.SOURCE_CONFIGURATION_NOT_FOUND.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert not "Should have raised an exception."


def test_get_source_details_raises_error_if_other_errors_getting_source(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    # TODO: Complete removal of URL env var.
    os.environ["SOURCE_API_URL"] = _SOURCE_API_URL
    source_id = "sourceId"
    get_source_url = f"{_SOURCE_API_URL}/sources/{source_id}"
    requests_mock.get(get_source_url, status_code=500)
    upload_id = "upload_id"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.get_source_details("env", source_id, upload_id, {}, {})
    except Exception:
        assert requests_mock.request_history[0].url == get_source_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.INTERNAL_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert not "Should have raised an exception."


def test_retrieve_content_persists_downloaded_json_locally(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://foo.bar/"
    format = "JSON"
    requests_mock.get(content_url, json={"data": "yes"})
    files_s3_keys = retrieval.retrieve_content(
        "env", source_id, "upload_id", content_url, format, {}, {}, tempdir="/tmp")
    assert requests_mock.request_history[0].url == content_url
    assert "GHDSI" in requests_mock.request_history[0].headers["user-agent"]
    with open(files_s3_keys[0][0], "r") as f:
        assert json.load(f)["data"] == "yes"


@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
def test_retrieve_content_from_s3():
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = f"s3://{SOURCES_BUCKET}/bar"
    format = "JSON"
    s3_client.put_object(Bucket=SOURCES_BUCKET, Key='bar', Body=b'{"data": "yes"}')
    files_s3_keys = retrieval.retrieve_content(
        "env", source_id, "upload_id", content_url, format, {}, {}, tempdir="/tmp")
    with open(files_s3_keys[0][0], "r") as f:
        assert json.load(f)["data"] == "yes"


def test_retrieve_content_persists_downloaded_csv_locally(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://foo.bar/"
    format = "CSV"
    requests_mock.get(content_url, content=b"foo,bar\nbaz,quux\n")
    files_s3_keys = retrieval.retrieve_content(
        "env", source_id, "upload_id", content_url, format, {}, {}, tempdir="/tmp")
    assert requests_mock.request_history[0].url == content_url
    assert "GHDSI" in requests_mock.request_history[0].headers["user-agent"]
    with open(files_s3_keys[0][0], "r") as f:
        assert f.read().strip() == "foo,bar\nbaz,quux"


def test_retrieve_content_returns_local_and_s3_object_names(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://foo.bar/"
    requests_mock.get(content_url, json={"data": "yes"})
    results = retrieval.retrieve_content(
        "env", source_id, "upload_id", content_url, "JSON", {}, {}, tempdir="/tmp")
    assert all("/tmp/" in fn for fn, s3key, *opts in results)
    assert all(source_id in s3key for fn, s3key, *opts in results)


def test_retrieve_content_raises_error_for_non_supported_format(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    content_url = "http://foo.bar/"
    source_id = "source_id"
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})
    bad_format = "PDF"

    try:
        retrieval.retrieve_content(
            "env", source_id, upload_id, content_url, bad_format, {}, {}, tempdir="/tmp")
    except ValueError:
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.SOURCE_CONFIGURATION_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert not "Should have raised an exception."


def test_retrieve_content_raises_error_for_source_content_not_found(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    content_url = "http://foo.bar/"
    requests_mock.get(content_url, status_code=404)
    source_id = "source_id"
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.retrieve_content(
            "env", source_id, upload_id, content_url, "JSON", {}, {}, tempdir="/tmp")
    except Exception:
        assert requests_mock.request_history[0].url == content_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.SOURCE_CONTENT_NOT_FOUND.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert not "Should have raised an exception."


def test_retrieve_content_raises_error_if_other_errors_getting_source_content(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    content_url = "http://bar.baz/"
    requests_mock.get(content_url, status_code=500)
    source_id = "source_id"
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.retrieve_content(
            "env", source_id, upload_id, content_url, "JSON", {}, {}, tempdir="/tmp")
    except Exception:
        assert requests_mock.request_history[0].url == content_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.SOURCE_CONTENT_DOWNLOAD_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert not "Should have raised an exception."


@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
def test_upload_to_s3_writes_indicated_file_to_key():
    from retrieval import retrieval  # Import locally to avoid superseding mock
    local_file = "/tmp/data.txt"
    expected_data = "This is data."
    with open(local_file, "w") as f:
        f.write(expected_data)
    expected_s3_bucket = retrieval.OUTPUT_BUCKET
    expected_s3_key = "objectkey"
    retrieval.upload_to_s3(local_file, expected_s3_key,
                           "", "", "", {}, {})  # api creds
    actual_object = s3_client.get_object(
        Bucket=expected_s3_bucket, Key=expected_s3_key)
    s3_data = actual_object['Body'].read().decode("utf-8")
    assert s3_data == expected_data


@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
def test_upload_to_s3_raises_error_on_s3_error(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    upload_id = "123456789012345678901234"
    source_id = "source_id"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.upload_to_s3("not a file name", "not an s3 key",
                               "env", source_id, upload_id, {}, {})  # api creds
    except Exception:
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.INTERNAL_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert not "Should have raised an exception."


def test_raw_content_unzips():
    from retrieval import retrieval
    # Creating a fake zip file with one file in it.
    name = None
    _, name = tempfile.mkstemp()
    with zipfile.ZipFile(name, 'w') as zf:
        zf.writestr('somefile', 'foo')

    url = 'http://mock/url.zip'
    with open(name, "rb") as f:
        wrappedBytes = retrieval.raw_content(url, f.read(), tempdir="/tmp")
        # Content should be the content of the first file in the zip.
        assert wrappedBytes.read() == b'foo'


def test_raw_content_ignores_unknown_mimetypes():
    from retrieval import retrieval
    url = 'http://mock/url'
    wrappedBytes = retrieval.raw_content(url, b'foo', tempdir="/tmp")
    assert wrappedBytes.read() == b'foo'


def test_find_source_name_in_ingestion_queue():
    from retrieval import retrieval

    # Mock boto3.client("batch") and .list_jobs()
    class b3batch:
        def list_jobs(*args, **kwargs):
            return {"jobSummaryList": [
                {"jobName": "testcountry-testcountry-ingestor-prod",
                 "status": "RUNNING"
                 }]}
    with patch('retrieval.retrieval.boto3.client') as mock:
        mock.return_value = b3batch()
        assert not retrieval.find_source_name_in_ingestion_queue(None)  # Null case should return False
        assert not retrieval.find_source_name_in_ingestion_queue('country-not-found')  # Miss should return false
        assert retrieval.find_source_name_in_ingestion_queue('testcountry')  # Hit should return true


# Helper function to compare output files to expected (string)
def compare_files(filename1: str, filename2: str):
    try:
        with open(filename1, "r") as file1, \
                open(filename2, 'r') as file2:
            for (line1, line2) in zip(file1, file2, strict=True):
                if line1 != line2:
                    return False
    except ValueError:  # zip-strict
        return False
    return True


def test_compare_files():
    # Make sure compare_files works as expected...
    assert compare_files(  # compare to self
        './parsing/diff_test/file1_initial.csv',
        './parsing/diff_test/file1_initial.csv')
    assert not compare_files(  # same length, diff content
        './parsing/diff_test/file2_add4.csv',
        './parsing/diff_test/file2_add4_sorted.csv')
    assert not compare_files(  # different length
        './parsing/diff_test/file1_initial.csv',
        './parsing/diff_test/file2_add4.csv')


@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
def test_generate_deltas():
    '''Generate delta files from current and previous successful source'''
    from retrieval import retrieval

    # Helper function to create upload records
    def _u(i, status, date, created=0, errors=0, updated=0, accepted=None, deltas=None):
        u = {
            "_id": i,
            "status": status.name,
            "created": str(datetime.datetime.fromisoformat(date)),
            "summary": {"numCreated": created, "numUpdated": updated, "numError": errors},
        }
        if accepted is not None:
            u["accepted"] = accepted
        if deltas is not None:
            u["deltas"] = deltas
        return u
    UploadStatus = Enum("Status", "SUCCESS IN_PROGRESS ERROR")

    # Mock download_file() function --- used for last-successful-ingestion
    last_successful_ingestion = ''  # Set before calling download_file_mock
    def download_file_mock(bucket, key, filename):  # noqa: E306
        shutil.copyfile(last_successful_ingestion, filename)
        pass

    with patch('retrieval.retrieval.find_source_name_in_ingestion_queue') \
            as find_source_name_in_ingestion_queue, \
            patch('retrieval.retrieval.s3_client.download_file') as download_file:
        find_source_name_in_ingestion_queue.return_value = False
        download_file.side_effect = download_file_mock
        # Default paramters for generate_deltas call
        latest_filename = ''  # populate as we go
        uploads = []  # populate as we go
        s3_bucket = 's3_bucket'  # only used for download_file (mocked above)
        source_id = 'source_id'  # only used for download_file (mocked above)
        source_format = 'CSV'  # only CSV supported (others tested below)
        sort_sources = True  # (default); unsorted results are machine dependent on 'comm'

        # ### Test normal process ###
        #
        # Outputs are (add_filename, del_filename),
        # or (None, None) upon fail / bulk ingestion.
        # Both, either or neither can be None.
        #
        # Run these tests in order as they examine differences from one
        # upload to the next.

        # 1: Test initial (bulk) upload (no delta outputs to check)
        reject_deltas = None, None
        last_successful_ingestion = ''
        latest_filename = './parsing/diff_test/file1_initial.csv'
        assert retrieval.generate_deltas(
            latest_filename, uploads, s3_bucket, source_id, source_format,
            sort_sources) == reject_deltas
        uploads.append(_u("60f734296e50eb2592992fb0", UploadStatus.SUCCESS,
                          "2020-12-31", 8))

        # 2: Add initial upload to history, test ADD-only delta
        last_successful_ingestion = latest_filename
        latest_filename = './parsing/diff_test/file2_add4.csv'
        (file_add, file_del) = retrieval.generate_deltas(
            latest_filename, uploads, s3_bucket, source_id, source_format,
            sort_sources)
        assert file_add and not file_del
        assert compare_files(file_add, './parsing/diff_test/file2_add4_mindiff.csv')
        uploads.append(_u("60f733dcfae8bf76717d598e", UploadStatus.SUCCESS,
                          "2021-01-01", 4, deltas=True))

        # 3: Test DEL-only delta
        last_successful_ingestion = latest_filename
        latest_filename = './parsing/diff_test/file3_rem3.csv'
        (file_add, file_del) = retrieval.generate_deltas(
            latest_filename, uploads, s3_bucket, source_id, source_format,
            sort_sources)
        assert file_del and not file_add
        assert compare_files(file_del, './parsing/diff_test/file3_rem3_mindiff.csv')
        uploads.append(_u("60f733dcfae8bf76717d111a", UploadStatus.SUCCESS,
                          "2021-01-10", 5, deltas=True))

        # 4: Headers do not match (occurs when source formats change)
        last_successful_ingestion = latest_filename
        latest_filename = './parsing/diff_test/file_badheader.csv'
        assert retrieval.generate_deltas(
            latest_filename, uploads, s3_bucket, source_id, source_format,
            sort_sources) == reject_deltas

        # ### Failure cases ###

        # Non-supported file-type
        last_successful_ingestion = ''
        latest_filename = './parsing/diff_test/file1_initial.csv'
        assert retrieval.generate_deltas(
            latest_filename, uploads, s3_bucket, source_id, source_format='JSON',
            sort_sources=sort_sources) == reject_deltas

        # Deltas larger than half the record (revert to bulk upload)
        last_successful_ingestion = './parsing/diff_test/file1_initial.csv'
        latest_filename = './parsing/diff_test/file4_headeronly.csv'
        assert retrieval.generate_deltas(
            latest_filename, uploads, s3_bucket, source_id, source_format,
            sort_sources=sort_sources) == reject_deltas
