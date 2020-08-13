# Tests for the parsing library common logic.
# If you come from a unittest background and wonder at how requests_mock
# arrives by magic here, check out
# https://requests-mock.readthedocs.io/en/latest/pytest.html?highlight=pytest#pytest
import boto3
import json
import os
import pytest
import requests
import datetime

from mock import MagicMock, patch
from moto import mock_s3

_SOURCE_ID = "abc123"
_SOURCE_URL = "https://foo.bar"
_PARSED_CASE = (
    {
        "caseReference": {
            "sourceId": _SOURCE_ID,
            "sourceEntryId": "48765",
            "sourceUrl": _SOURCE_URL
        },
        "location": {
            "country": "India",
            "administrativeAreaLevel1": "Bihar",
            "administrativeAreaLevel2": "Darbhanga",
            "administrativeAreaLevel3": "Hanuman Nagar",
            "query": "Hanuman Nagar, Darbhanga, Bihar, India"
        },
        "events": [
            {
                "name": "confirmed",
                "dateRange":
                        {
                            "start": "06/05/2020Z",
                            "end": "06/05/2020Z"
                        }
            }
        ],
        "demographics": {
            "ageRange": {
                "start": 65,
                "end": 65
            },
            "sex": "Male"
        },
        "notes": None
    })

# Minimum case to check for date filtering.
CASE_JUNE_FIFTH = {
    "events": [
        {
            "name": "confirmed",
            "dateRange":
                    {
                        "start": "06/05/2020Z",
                        "end": "06/05/2020Z"
                    }
        }
    ],
}


def fake_parsing_fn(raw_data_file, source_id, source_url):
    """For use in testing parsing_lib.run_lambda()."""
    return [_PARSED_CASE]


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
def input_event():
    """Loads valid Event input from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "input_event.json")
    with open(file_path) as event_file:
        return json.load(event_file)


@pytest.fixture()
def sample_data():
    """Loads sample source data from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "sample_data.json")
    with open(file_path) as event_file:
        return json.load(event_file)


@mock_s3
def test_run_lambda_e2e(input_event, sample_data, requests_mock, s3):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock

    # Mock OAuth and create local S3.
    parsing_lib.obtain_api_credentials = MagicMock(
        name="obtain_api_credentials")
    s3.create_bucket(Bucket=input_event[parsing_lib.S3_BUCKET_FIELD])
    s3.put_object(
        Bucket=input_event[parsing_lib.S3_BUCKET_FIELD],
        Key=input_event[parsing_lib.S3_KEY_FIELD],
        Body=json.dumps(sample_data))

    # Mock the batch upsert call.
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    full_source_url = f"{source_api_url}/cases/batchUpsert"
    num_created = 10
    num_updated = 5
    requests_mock.post(
        full_source_url,
        json={"createdCaseIds": list(range(num_created)),
              "updatedCaseIds": list(range(num_updated))})

    # Delete the provided upload ID to force parsing_lib to create a new upload.
    # Mock the create and update upload calls.
    del input_event[parsing_lib.UPLOAD_ID_FIELD]
    base_upload_url = f"{source_api_url}/sources/{input_event['sourceId']}/uploads"
    create_upload_url = base_upload_url
    upload_id = "123456789012345678901234"
    requests_mock.post(
        create_upload_url,
        json={"_id": upload_id, "status": "IN_PROGRESS",
              "summary": {}},
        status_code=201)
    update_upload_url = f"{base_upload_url}/{upload_id}"
    requests_mock.put(
        update_upload_url,
        json={"_id": upload_id, "status": "SUCCESS",
              "summary": {"numCreated": num_created, "numUpdated": num_updated}})

    response = parsing_lib.run_lambda(input_event, "", fake_parsing_fn)

    assert requests_mock.request_history[0].url == create_upload_url
    assert requests_mock.request_history[1].url == full_source_url
    assert requests_mock.request_history[2].url == update_upload_url
    assert response["count_created"] == num_created
    assert response["count_updated"] == num_updated


@mock_s3
def test_retrieve_raw_data_file_stores_s3_in_local_file(
        input_event, s3, sample_data):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    s3.create_bucket(Bucket=input_event[parsing_lib.S3_BUCKET_FIELD])
    s3.put_object(
        Bucket=input_event[parsing_lib.S3_BUCKET_FIELD],
        Key=input_event[parsing_lib.S3_KEY_FIELD],
        Body=json.dumps(sample_data))

    local_file = parsing_lib.retrieve_raw_data_file(
        input_event[parsing_lib.S3_BUCKET_FIELD],
        input_event[parsing_lib.S3_KEY_FIELD])
    assert local_file == parsing_lib.LOCAL_DATA_FILE
    with open(local_file, "r") as f:
        assert json.load(f) == sample_data


def test_extract_event_fields_returns_all_present_fields(input_event):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    assert parsing_lib.extract_event_fields(input_event) == (
        input_event[parsing_lib.SOURCE_URL_FIELD],
        input_event[parsing_lib.SOURCE_ID_FIELD],
        input_event[parsing_lib.UPLOAD_ID_FIELD],
        input_event[parsing_lib.S3_BUCKET_FIELD],
        input_event[parsing_lib.S3_KEY_FIELD],
        input_event[parsing_lib.DATE_FILTER_FIELD])


def test_extract_event_fields_errors_if_missing_bucket_field():
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=parsing_lib.S3_BUCKET_FIELD):
        parsing_lib.extract_event_fields({parsing_lib.S3_KEY_FIELD: "key"})


def test_extract_event_fields_errors_if_missing_key_field():
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=parsing_lib.S3_BUCKET_FIELD):
        parsing_lib.extract_event_fields(
            {parsing_lib.S3_BUCKET_FIELD: "bucket"})


def test_prepare_cases_adds_upload_id(requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    upload_id = "123456789012345678901234"
    result = parsing_lib.prepare_cases(
        [_PARSED_CASE],
        upload_id)
    assert result[0]["caseReference"]["uploadId"] == upload_id


def test_create_upload_record_returns_upload_id(requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    create_upload_url = f"{source_api_url}/sources/{_SOURCE_ID}/uploads"
    upload_id = "123456789012345678901234"
    requests_mock.post(
        create_upload_url,
        json={"_id": upload_id, "status": "IN_PROGRESS", "summary": {}},
        status_code=201)

    response = parsing_lib.create_upload_record(_SOURCE_ID, {})

    assert requests_mock.request_history[0].url == create_upload_url
    assert response == upload_id


def test_create_upload_record_raises_error_for_failed_request(requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    create_upload_url = f"{source_api_url}/sources/{_SOURCE_ID}/uploads"
    requests_mock.register_uri(
        "POST",
        create_upload_url,
        exc=requests.exceptions.ConnectTimeout)

    try:
        parsing_lib.create_upload_record(_SOURCE_ID, {})
    except requests.exceptions.ConnectTimeout:
        return

    # We got the wrong exception or no exception, fail the test.
    assert False


def test_write_to_server_returns_created_and_updated_count(
        requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    full_source_url = f"{source_api_url}/cases/batchUpsert"
    requests_mock.post(
        full_source_url,
        json={"createdCaseIds": list(range(10)),
              "updatedCaseIds": list(range(5))})

    count_created, count_updated = parsing_lib.write_to_server(
        [_PARSED_CASE], _SOURCE_ID, "upload_id", {})
    assert requests_mock.request_history[0].url == full_source_url
    assert count_created == 10
    assert count_updated == 5


def test_write_to_server_raises_error_for_failed_batch_upsert(
        requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    full_source_url = f"{source_api_url}/cases/batchUpsert"
    requests_mock.register_uri(
        "POST", full_source_url, json={}, status_code=500),
    upload_id = "123456789012345678901234"
    update_upload_url = f"{source_api_url}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.register_uri("PUT", update_upload_url, json={})

    try:
        parsing_lib.write_to_server([_PARSED_CASE], _SOURCE_ID, upload_id, {})
    except RuntimeError:
        assert requests_mock.request_history[0].url == full_source_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": parsing_lib.UploadError.DATA_UPLOAD_ERROR.name}}
        return
    # We got the wrong exception or no exception, fail the test.
    assert False


def test_finalize_upload_invokes_update_api(requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    upload_id = "123456789012345678901234"
    update_upload_url = f"{source_api_url}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    num_created = 42
    num_updated = 0
    requests_mock.put(
        update_upload_url,
        json={"_id": upload_id, "status": "SUCCESS",
              "summary": {"numCreated": num_created, "numUpdated": num_updated}})

    parsing_lib.finalize_upload(
        _SOURCE_ID, upload_id, {}, num_created, num_updated)

    assert requests_mock.request_history[0].url == update_upload_url


def test_finalize_upload_raises_error_for_failed_request(requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    upload_id = "123456789012345678901234"
    update_upload_url = f"{source_api_url}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.register_uri(
        "PUT",
        update_upload_url,
        [{"json": {}, "status_code": 500}, {"json": {}}])

    try:
        parsing_lib.finalize_upload(_SOURCE_ID, upload_id, {}, 42, 0)
    except RuntimeError:
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": parsing_lib.UploadError.INTERNAL_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert False


@patch('parsing_lib.parsing_lib.get_today')
def test_filter_cases_by_date_today(mock_today):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 8)
    cases = parsing_lib.filter_cases_by_date(
        [CASE_JUNE_FIFTH],
        {"numDaysBeforeToday": 3, "op": "EQ"},
        "source_id", "upload_id", {})  # api_creds
    assert list(cases) == [CASE_JUNE_FIFTH]


@patch('parsing_lib.parsing_lib.get_today')
def test_filter_cases_by_date_not_today(mock_today):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 10, 10)
    cases = parsing_lib.filter_cases_by_date(
        [CASE_JUNE_FIFTH],
        {"numDaysBeforeToday": 3, "op": "EQ"},
        "source_id", "upload_id", {})  # api_creds
    assert cases == []


@patch('parsing_lib.parsing_lib.get_today')
def test_filter_cases_by_date_exactly_before_today(mock_today):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 8)
    cases = parsing_lib.filter_cases_by_date(
        [CASE_JUNE_FIFTH],
        {"numDaysBeforeToday": 3, "op": "LT"},
        "source_id", "upload_id", {})  # api_creds
    assert cases == []


@patch('parsing_lib.parsing_lib.get_today')
def test_filter_cases_by_date_before_today(mock_today):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 10)
    cases = parsing_lib.filter_cases_by_date(
        [CASE_JUNE_FIFTH],
        {"numDaysBeforeToday": 3, "op": "LT"},
        "source_id", "upload_id", {})  # api_creds
    assert list(cases) == [CASE_JUNE_FIFTH]


def test_filter_cases_by_date_unsupported_op(requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    upload_id = "123456789012345678901234"
    update_upload_url = f"{source_api_url}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.put(
        update_upload_url,
        json={"_id": upload_id, "status": "ERROR",
              "summary": {"error": "SOURCE_CONFIGURATION_ERROR"}})

    try:
        parsing_lib.filter_cases_by_date(
            [CASE_JUNE_FIFTH],
            {"numDaysBeforeToday": 3, "op": "NOPE"},
            _SOURCE_ID, upload_id, {})  # api_creds
    except ValueError as ve:
        assert "NOPE" in str(ve)
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[-1].json() == {"status": "ERROR", "summary": {
            "error": "SOURCE_CONFIGURATION_ERROR"}}
        return
    assert "Should have raised a ValueError exception" == False


def test_complete_with_error_raises_exception():
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    e = ValueError("Oops!")
    try:
        parsing_lib.complete_with_error(e)
    except ValueError:
        return

    # We got the wrong exception or no exception, fail the test.
    assert False


def test_complete_with_error_updates_upload_if_provided_data(requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    upload_id = "123456789012345678901234"
    update_upload_url = f"{source_api_url}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})
    e = ValueError("Oops!")

    try:
        upload_error = parsing_lib.UploadError.SOURCE_CONFIGURATION_ERROR
        parsing_lib.complete_with_error(
            e, upload_error, _SOURCE_ID, upload_id, {})
    except ValueError:
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": upload_error.name}}
        return
    # We got the wrong exception or no exception, fail the test.
    assert "Should have raised a ValueError exception" == False
