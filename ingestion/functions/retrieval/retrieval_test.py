import boto3
import datetime
import json
import os
import pytest
import tempfile
import sys
import zipfile

from unittest.mock import MagicMock, patch

try:
    import common_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir, 'common'))
    import common_lib


s3_client = boto3.client("s3",
    endpoint_url=os.environ.get("AWS_ENDPOINT", "http://localstack:4566"),
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)

_SOURCE_API_URL = "http://foo.bar"

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

@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
def test_lambda_handler_e2e(valid_event, requests_mock,
                            mock_source_api_url_fixture, tempdir="/tmp"):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    print(valid_event)

    # Mock/stub retrieving credentials, invoking the parser lambda, and S3.
    common_lib = mock_source_api_url_fixture
    common_lib.obtain_api_credentials = MagicMock(
        name="obtain_api_credentials", return_value={})
    retrieval.invoke_parser = MagicMock(name="invoke_parser")

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
    source_id = valid_event['sourceId']
    upload_id = "012345678901234567890123"
    origin_url = "http://bar.baz/"

    # Mock the request to create the upload.
    create_upload_url = f"{_SOURCE_API_URL}/sources/{source_id}/uploads"
    requests_mock.post(
        create_upload_url, json={"_id": upload_id},
        status_code=201)

    # Mock the request to retrieval source details (e.g. format).
    date_filter = {"numDaysBeforeToday": 2, "op": "EQ"}
    full_source_url = f"{_SOURCE_API_URL}/sources/{source_id}"
    requests_mock.get(
        full_source_url,
        json={"origin": {"url": origin_url, "license": "MIT"}, "format": "JSON",
              "automation": {"parser": {"awsLambdaArn": "arn"}},
              "dateFilter": date_filter})

    # Mock the request to retrieve source content.
    requests_mock.get(origin_url, json={"data": "yes"})

    response = retrieval.lambda_handler(tempdir=tempdir)

    common_lib.obtain_api_credentials.assert_called_once()
    retrieval.invoke_parser.assert_called_once_with(
        valid_event["env"],
        source_id, upload_id, {}, None,
        response["key"],
        origin_url, date_filter, valid_event["parsingDateRange"])
    assert requests_mock.request_history[0].url == create_upload_url
    assert requests_mock.request_history[1].url == full_source_url
    assert requests_mock.request_history[2].url == origin_url
    assert response["bucket"] == retrieval.OUTPUT_BUCKET
    assert source_id in response["key"]
    assert response["upload_id"] == upload_id


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


def test_get_source_details_returns_url_and_format(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://bar.baz"
    requests_mock.get(f"{_SOURCE_API_URL}/sources/{source_id}",
                      json={"format": "CSV",
                            "origin": {"url": content_url, "license": "MIT"}})
    result = retrieval.get_source_details(
        "env", source_id, "upload_id", {}, {})
    assert result[0] == content_url
    assert result[1] == "CSV"
    assert result[2] == ""


def test_get_source_details_returns_parser_arn_if_present(
        requests_mock, mock_source_api_url_fixture):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://bar.baz"
    lambda_arn = "lambdaArn"
    requests_mock.get(
        f"{_SOURCE_API_URL}/sources/{source_id}",
        json={"origin": {"url": content_url, "license": "MIT"},
              "format": "JSON",
              "automation": {"parser": {"awsLambdaArn": lambda_arn}}})
    result = retrieval.get_source_details(
        "env", source_id, "upload_id", {}, {})
    assert result[2] == lambda_arn


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
    assert all("/tmp/" in fn for fn, s3key in results)
    assert all(source_id in s3key for fn, s3key in results)


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
