# Tests for the parsing library common logic.
# If you come from a unittest background and wonder at how requests_mock
# arrives by magic here, check out
# https://requests-mock.readthedocs.io/en/latest/pytest.html?highlight=pytest#pytest
import boto3
import json
import os
import pytest
import requests

from datetime import date
from mock import MagicMock
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
    parsing_lib.obtain_api_credentials = MagicMock(
        name="obtain_api_credentials")
    s3.create_bucket(Bucket=input_event[parsing_lib.S3_BUCKET_FIELD])
    s3.put_object(
        Bucket=input_event[parsing_lib.S3_BUCKET_FIELD],
        Key=input_event[parsing_lib.S3_KEY_FIELD],
        Body=json.dumps(sample_data))
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    full_source_url = f"{source_api_url}/cases/batchUpsert"
    requests_mock.post(full_source_url, json={"createdCaseIds": list(range(10)), "updatedCaseIds": list(range(5))})

    response = parsing_lib.run_lambda(input_event, "", fake_parsing_fn)

    assert requests_mock.request_history[0].url == full_source_url
    assert response["count_created"] == 10
    assert response["count_updated"] == 5


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


def test_extract_event_fields_returns_url_bucket_and_key(input_event):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    assert parsing_lib.extract_event_fields(input_event) == (
        input_event[parsing_lib.SOURCE_URL_FIELD],
        input_event[parsing_lib.S3_BUCKET_FIELD],
        input_event[parsing_lib.S3_KEY_FIELD])


def test_extract_event_fields_errors_if_missing_bucket_field():
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=parsing_lib.S3_BUCKET_FIELD):
        parsing_lib.extract_event_fields({parsing_lib.S3_KEY_FIELD: "key"})


def test_extract_event_fields_errors_if_missing_key_field():
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=parsing_lib.S3_BUCKET_FIELD):
        parsing_lib.extract_event_fields(
            {parsing_lib.S3_BUCKET_FIELD: "bucket"})


def test_write_to_server_returns_created_and_updated_count(
        requests_mock):
    from parsing_lib import parsing_lib  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    full_source_url = f"{source_api_url}/cases/batchUpsert"
    requests_mock.post(full_source_url, json={"createdCaseIds": list(range(10)), "updatedCaseIds": list(range(5))})

    count_created, count_updated = parsing_lib.write_to_server([_PARSED_CASE], {})
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
        "POST", full_source_url, exc=requests.exceptions.ConnectTimeout),

    try:
        count_created, count_updated = parsing_lib.write_to_server([_PARSED_CASE], {})
    except requests.exceptions.ConnectTimeout:
        return
    # We got the wrong exception or no exception, fail the test.
    assert False
