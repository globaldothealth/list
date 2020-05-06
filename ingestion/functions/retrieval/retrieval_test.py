import boto3
import json
import os
import pytest

from moto import mock_s3


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
def test_persist_supplied_source_id_to_s3(valid_event, requests_mock, s3):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    expected_s3_bucket = retrieval.OUTPUT_BUCKET
    s3.create_bucket(Bucket=expected_s3_bucket)
    requests_mock.get("http://checkip.amazonaws.com/", text="111.1.1.1")

    response = retrieval.lambda_handler(valid_event, "")

    assert response["bucket"] == expected_s3_bucket
    assert str.startswith(response["key"], valid_event["sourceId"])
    assert s3.list_objects_v2(Bucket=expected_s3_bucket)['KeyCount'] == 1


@mock_s3
def test_s3_object_contains_machine_ip(valid_event, requests_mock, s3):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    expected_s3_bucket = retrieval.OUTPUT_BUCKET
    s3.create_bucket(Bucket=expected_s3_bucket)
    expected_ip = "111.1.1.1"
    requests_mock.get("http://checkip.amazonaws.com/", text=expected_ip)

    response = retrieval.lambda_handler(valid_event, "")

    actual_object = s3.get_object(
        Bucket=expected_s3_bucket, Key=response["key"])
    actual_ip = actual_object['Body'].read().decode("utf-8")
    assert actual_ip == expected_ip


def test_error_for_event_without_source_id(invalid_event, requests_mock):
    from retrieval import retrieval  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=retrieval.SOURCE_ID_FIELD):
        retrieval.lambda_handler(invalid_event, "")
