import boto3
import json
import os
import pytest

from moto import mock_s3
from unittest.mock import MagicMock


@pytest.fixture()
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"


@pytest.fixture()
def s3(aws_credentials):
    """Mock S3 connection."""
    with mock_s3():
        yield boto3.client("s3", region_name="us-east-1")


@pytest.fixture()
def valid_event():
    """Loads valid CloudWatch ScheduledEvent from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "valid_scheduled_event.json")
    with open(file_path) as event_file:
        return json.load(event_file)


@pytest.fixture()
def invalid_event():
    """Loads invalid CloudWatch ScheduledEvent from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "invalid_scheduled_event.json")
    with open(file_path) as event_file:
        return json.load(event_file)


@mock_s3
def test_lambda_handler_e2e(valid_event, requests_mock, s3):
    from retrieval import retrieval  # Import locally to avoid superseding mock

    # Mock/stub retrieving credentials, invoking the parser lambda, and S3.
    import common_lib  # Import locally to avoid superseding mock
    common_lib.obtain_api_credentials = MagicMock(
        name="obtain_api_credentials", return_value={})
    retrieval.invoke_parser = MagicMock(name="invoke_parser")
    s3.create_bucket(Bucket=retrieval.OUTPUT_BUCKET)

    # Set up mock request values used in multiple requests.
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    source_id = valid_event['sourceId']
    upload_id = "012345678901234567890123"
    origin_url = "http://bar.baz/"

    # Mock the request to create the upload.
    create_upload_url = f"{source_api_url}/sources/{source_id}/uploads"
    requests_mock.post(
        create_upload_url, json={"_id": upload_id},
        status_code=201)

    # Mock the request to retrieval source details (e.g. format).
    date_filter = {"numDaysBeforeToday": 2, "op": "EQ"}
    full_source_url = f"{source_api_url}/sources/{source_id}"
    lambda_arn = "arn"
    requests_mock.get(
        full_source_url,
        json={"origin": {"url": origin_url}, "format": "JSON",
              "automation": {"parser": {"awsLambdaArn": lambda_arn}},
              "dateFilter": date_filter})

    # Mock the request to retrieve source content.
    requests_mock.get(origin_url, json={"data": "yes"})

    response = retrieval.lambda_handler(valid_event, "")

    common_lib.obtain_api_credentials.assert_called_once()
    retrieval.invoke_parser.assert_called_once_with(
        lambda_arn, source_id, upload_id, {},
        response["key"],
        origin_url, date_filter)
    assert requests_mock.request_history[0].url == create_upload_url
    assert requests_mock.request_history[1].url == full_source_url
    assert requests_mock.request_history[2].url == origin_url
    assert response["bucket"] == retrieval.OUTPUT_BUCKET
    assert source_id in response["key"]


def test_extract_source_id_returns_id_field(valid_event):
    from retrieval import retrieval
    assert retrieval.extract_source_id(valid_event) == valid_event["sourceId"]


def test_extract_source_id_raises_error_if_event_lacks_id(invalid_event):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=retrieval.SOURCE_ID_FIELD):
        retrieval.extract_source_id(invalid_event)


def test_get_source_details_returns_url_and_format(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    source_id = "id"
    content_url = "http://bar.baz"
    os.environ["SOURCE_API_URL"] = source_api_url
    requests_mock.get(f"{source_api_url}/sources/{source_id}",
                      json={"format": "CSV", "origin": {"url": content_url}})
    result = retrieval.get_source_details(source_id, "upload_id", {})
    assert result[0] == content_url
    assert result[1] == "CSV"
    assert result[2] == ""


def test_get_source_details_returns_parser_arn_if_present(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    source_id = "id"
    content_url = "http://bar.baz"
    os.environ["SOURCE_API_URL"] = source_api_url
    lambda_arn = "lambdaArn"
    requests_mock.get(
        f"{source_api_url}/sources/{source_id}",
        json={"origin": {"url": content_url}, "format": "JSON",
              "automation": {"parser": {"awsLambdaArn": lambda_arn}}})
    result = retrieval.get_source_details(source_id, "upload_id", {})
    assert result[2] == lambda_arn


def test_get_source_details_raises_error_if_source_not_found(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    source_id = "id"
    os.environ["SOURCE_API_URL"] = source_api_url
    get_source_url = f"{source_api_url}/sources/{source_id}"
    requests_mock.get(get_source_url, status_code=404)
    upload_id = "upload_id"
    update_upload_url = f"{source_api_url}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.get_source_details(source_id, upload_id, {})
    except Exception:
        assert requests_mock.request_history[0].url == get_source_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": retrieval.UploadError.SOURCE_CONFIGURATION_NOT_FOUND.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert "Should have raised an exception." == False


def test_get_source_details_raises_error_if_other_errors_getting_source(
        requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    source_id = "id"
    os.environ["SOURCE_API_URL"] = source_api_url
    get_source_url = f"{source_api_url}/sources/{source_id}"
    requests_mock.get(get_source_url, status_code=500)
    upload_id = "upload_id"
    update_upload_url = f"{source_api_url}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.get_source_details(source_id, upload_id, {})
    except Exception:
        assert requests_mock.request_history[0].url == get_source_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": retrieval.UploadError.INTERNAL_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert "Should have raised an exception." == False


def test_retrieve_content_persists_downloaded_json_locally(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://foo.bar/"
    format = "JSON"
    requests_mock.get(content_url, json={"data": "yes"})
    retrieval.retrieve_content(source_id, "upload_id", content_url, format, {})
    assert requests_mock.request_history[0].url == content_url
    assert "GHDSI" in requests_mock.request_history[0].headers["user-agent"]
    with open("/tmp/content.json", "r") as f:
        assert json.load(f)["data"] == "yes"


def test_retrieve_content_persists_downloaded_csv_locally(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://foo.bar/"
    format = "CSV"
    requests_mock.get(content_url, content=b"foo,bar")
    retrieval.retrieve_content(source_id, "upload_id", content_url, format, {})
    assert requests_mock.request_history[0].url == content_url
    assert "GHDSI" in requests_mock.request_history[0].headers["user-agent"]
    with open("/tmp/content.csv", "r") as f:
        assert f.read() == "foo,bar"


def test_retrieve_content_returns_local_and_s3_object_names(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_id = "id"
    content_url = "http://foo.bar/"
    requests_mock.get(content_url, json={"data": "yes"})
    result = retrieval.retrieve_content(
        source_id, "upload_id", content_url, "JSON", {})
    assert "/tmp/" in result[0]
    assert source_id in result[1]


def test_retrieve_content_raises_error_for_non_supported_format(requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    content_url = "http://foo.bar/"
    requests_mock.get(content_url)
    source_api_url = "http://bar.baz"
    os.environ["SOURCE_API_URL"] = source_api_url
    source_id = "source_id"
    upload_id = "123456789012345678901234"
    update_upload_url = f"{source_api_url}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})
    bad_format = "PDF"

    try:
        retrieval.retrieve_content(
            source_id, upload_id, content_url, bad_format, {})
    except ValueError:
        assert requests_mock.request_history[0].url == content_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": retrieval.UploadError.SOURCE_CONFIGURATION_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert "Should have raised an exception." == False


def test_retrieve_content_raises_error_for_source_content_not_found(
        requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    content_url = "http://foo.bar/"
    requests_mock.get(content_url, status_code=404)
    source_api_url = "http://bar.baz"
    os.environ["SOURCE_API_URL"] = source_api_url
    source_id = "source_id"
    upload_id = "123456789012345678901234"
    update_upload_url = f"{source_api_url}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.retrieve_content(
            source_id, upload_id, content_url, "JSON", {})
    except Exception:
        assert requests_mock.request_history[0].url == content_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": retrieval.UploadError.SOURCE_CONTENT_NOT_FOUND.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert "Should have raised an exception." == False


def test_retrieve_content_raises_error_if_other_errors_getting_source_content(
        requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    content_url = "http://foo.bar/"
    requests_mock.get(content_url, status_code=500)
    source_api_url = "http://bar.baz"
    os.environ["SOURCE_API_URL"] = source_api_url
    source_id = "source_id"
    upload_id = "123456789012345678901234"
    update_upload_url = f"{source_api_url}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.retrieve_content(
            source_id, upload_id, content_url, "JSON", {})
    except Exception:
        assert requests_mock.request_history[0].url == content_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": retrieval.UploadError.SOURCE_CONTENT_DOWNLOAD_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert "Should have raised an exception." == False


@mock_s3
def test_upload_to_s3_writes_indicated_file_to_key(s3):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    local_file = "/tmp/data.txt"
    expected_data = "This is data."
    with open(local_file, "w") as f:
        f.write(expected_data)
    expected_s3_bucket = retrieval.OUTPUT_BUCKET
    s3.create_bucket(Bucket=expected_s3_bucket)
    expected_s3_key = "objectkey"
    retrieval.upload_to_s3(local_file, expected_s3_key,
                           "", "", {})  # api creds
    actual_object = s3.get_object(
        Bucket=expected_s3_bucket, Key=expected_s3_key)
    s3_data = actual_object['Body'].read().decode("utf-8")
    assert s3_data == expected_data


@mock_s3
def test_upload_to_s3_raises_error_on_s3_error(requests_mock, s3):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    upload_id = "123456789012345678901234"
    source_id = "source_id"
    update_upload_url = f"{source_api_url}/sources/{source_id}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})

    try:
        retrieval.upload_to_s3("not a file name", "not an s3 key",
                               source_id, upload_id, {})  # api creds
    except Exception:
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": retrieval.UploadError.INTERNAL_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert "Should have raised an exception." == False
