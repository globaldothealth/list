
import boto3
import json
import os
import pytest
import requests

from datetime import date
from moto import mock_s3
from unittest.mock import MagicMock

_PARSED_CASE = (
    {
        "revisionMetadata": {
            "revisionNumber": 0,
            "creationMetadata": {
                "curator": "auto",
                "date": date.today().strftime("%m/%d/%Y")
            }
        },
        "sources": [
            {
                "url": "https://api.covid19india.org/raw_data6.json",
            }
        ],
        "location": {
            "country": "India"
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
        }
    })


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
def test_lambda_handler_e2e(input_event, sample_data, requests_mock, s3):
    from india import india  # Import locally to avoid superseding mock
    india.obtain_api_credentials = MagicMock(name="obtain_api_credentials")
    s3.create_bucket(Bucket=input_event[india.S3_BUCKET_FIELD])
    s3.put_object(
        Bucket=input_event[india.S3_BUCKET_FIELD],
        Key=input_event[india.S3_KEY_FIELD],
        Body=json.dumps(sample_data))
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    full_source_url = f"{source_api_url}/cases"
    requests_mock.post(full_source_url)

    response = india.lambda_handler(input_event, "")

    assert requests_mock.request_history[0].url == full_source_url
    assert response["count_success"] == 1
    assert response["count_error"] == 0


def test_extract_s3_path_returns_bucket_and_key(input_event):
    from india import india  # Import locally to avoid superseding mock
    assert india.extract_s3_path(input_event) == (
        input_event[india.S3_BUCKET_FIELD],
        input_event[india.S3_KEY_FIELD])


def test_extract_s3_path_errors_if_missing_bucket_field():
    from india import india  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=india.S3_BUCKET_FIELD):
        india.extract_s3_path({india.S3_KEY_FIELD: "key"})


def test_extract_s3_path_errors_if_missing_key_field():
    from india import india  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=india.S3_BUCKET_FIELD):
        india.extract_s3_path({india.S3_BUCKET_FIELD: "bucket"})


@mock_s3
def test_retrieve_raw_data_file_stores_s3_in_local_file(
        input_event, s3, sample_data):
    from india import india  # Import locally to avoid superseding mock
    s3.create_bucket(Bucket=input_event[india.S3_BUCKET_FIELD])
    s3.put_object(
        Bucket=input_event[india.S3_BUCKET_FIELD],
        Key=input_event[india.S3_KEY_FIELD],
        Body=json.dumps(sample_data))

    local_file = india.retrieve_raw_data_file(
        input_event[india.S3_BUCKET_FIELD],
        input_event[india.S3_KEY_FIELD])
    assert local_file == india.LOCAL_DATA_FILE
    with open(local_file, "r") as f:
        assert json.load(f) == sample_data


def test_parse_cases_converts_fields_to_ghdsi_schema(sample_data):
    from india import india  # Import locally to avoid superseding mock
    data_file = "/tmp/data.json"
    with open(data_file, "w") as f:
        json.dump(sample_data, f)

    result, = india.parse_cases(data_file)
    assert result == _PARSED_CASE


def test_write_to_server_returns_success_count_for_each_entered_case(
        requests_mock):
    from india import india  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    full_source_url = f"{source_api_url}/cases"
    requests_mock.post(full_source_url)

    count_success, count_error = india.write_to_server([_PARSED_CASE], {})
    assert requests_mock.request_history[0].url == full_source_url
    assert count_success == 1
    assert count_error == 0


def test_write_to_server_returns_error_count_for_each_failed_write(
        requests_mock):
    from india import india  # Import locally to avoid superseding mock
    source_api_url = "http://foo.bar"
    os.environ["SOURCE_API_URL"] = source_api_url
    full_source_url = f"{source_api_url}/cases"
    requests_mock.register_uri(
        "POST", source_api_url, exc=requests.exceptions.ConnectTimeout),

    count_success, count_error = india.write_to_server([_PARSED_CASE], {})
    assert requests_mock.request_history[0].url == full_source_url
    assert count_success == 0
    assert count_error == 1
