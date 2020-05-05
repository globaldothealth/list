import logging
import json
import os
import pytest
import requests

from retrieval import retrieval


@pytest.fixture()
def scheduled_event():
    """Loads CloudWatch ScheduledEvent from file."""
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, 'scheduled_event.json')
    with open(file_path) as event_file:
        return json.load(event_file)


def test_lambda_handler(scheduled_event, requests_mock):
    expected_ip = "123.4.5.6"
    requests_mock.get("http://checkip.amazonaws.com/", text=expected_ip)
    response = retrieval.lambda_handler(scheduled_event, "")
    assert response['ip'] == expected_ip
