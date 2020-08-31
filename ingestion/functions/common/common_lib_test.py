import os
import pytest
import requests
import sys

from common import common_lib
from mock import MagicMock, patch

_SOURCE_API_URL = "https://foo.bar"
_SOURCE_ID = "abc123"


@pytest.fixture()
def mock_source_api_url_fixture():
    """
    Supplies a predetermined endpoint for G.h HTTP requests.

    Because we're testing this function in this file as well, this fixture
    can't be set to autouse.
    """
    with patch('common.common_lib.get_source_api_url') as mock:
        mock.return_value = _SOURCE_API_URL
        yield mock


def test_register_local_user(
        requests_mock, mock_source_api_url_fixture):
    requests_mock.post(
        "http://localhost:3001/auth/register",
        json={"email": "foo@bar.baz"},
        status_code=200,
        cookies={"foo": "bar"})

    cookies = common_lib.login("foo@bar.baz")

    assert cookies == {"foo": "bar"}

def test_create_upload_record_returns_upload_id(
        requests_mock, mock_source_api_url_fixture):
    create_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads"
    upload_id = "123456789012345678901234"
    requests_mock.post(
        create_upload_url,
        json={"_id": upload_id, "status": "IN_PROGRESS", "summary": {}},
        status_code=201)

    response = common_lib.create_upload_record("env", _SOURCE_ID, {}, {})

    assert requests_mock.request_history[0].url == create_upload_url
    assert response == upload_id


def test_create_upload_record_raises_error_for_failed_request(
        requests_mock, mock_source_api_url_fixture):
    create_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads"
    requests_mock.register_uri(
        "POST",
        create_upload_url,
        exc=requests.exceptions.ConnectTimeout)

    try:
        common_lib.create_upload_record("env", _SOURCE_ID, {}, {})
    except requests.exceptions.ConnectTimeout:
        return

    # We got the wrong exception or no exception, fail the test.
    assert False


def test_finalize_upload_invokes_update_api(
        requests_mock, mock_source_api_url_fixture):
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    num_created = 42
    num_updated = 0
    requests_mock.put(
        update_upload_url,
        json={"_id": upload_id, "status": "SUCCESS",
              "summary": {"numCreated": num_created, "numUpdated": num_updated}})

    common_lib.finalize_upload(
        "env", _SOURCE_ID, upload_id, {}, {}, num_created, num_updated)

    assert requests_mock.request_history[0].url == update_upload_url


def test_finalize_upload_raises_error_for_failed_request(
        requests_mock, mock_source_api_url_fixture):
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.register_uri(
        "PUT",
        update_upload_url,
        [{"json": {}, "status_code": 500}, {"json": {}}])

    try:
        common_lib.finalize_upload("env", _SOURCE_ID, upload_id, {}, {}, 42, 0)
    except RuntimeError:
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.INTERNAL_ERROR.name}}
        return

    # We got the wrong exception or no exception, fail the test.
    assert False


def test_complete_with_error_raises_exception():
    e = ValueError("Oops!")
    try:
        common_lib.complete_with_error(e)
    except ValueError:
        return

    # We got the wrong exception or no exception, fail the test.
    assert False


def test_complete_with_error_updates_upload_if_provided_data(
        requests_mock, mock_source_api_url_fixture):
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.put(update_upload_url, json={})
    e = ValueError("Oops!")

    try:
        upload_error = common_lib.UploadError.SOURCE_CONFIGURATION_ERROR
        common_lib.complete_with_error(
            e, "env", upload_error, _SOURCE_ID, upload_id, {}, {})
    except ValueError:
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": upload_error.name}}
        return
    # We got the wrong exception or no exception, fail the test.
    assert "Should have raised a ValueError exception" == False


def test_get_source_api_url_returns_mapped_value():
    for key, value in common_lib._ENV_TO_SOURCE_API_URL.items():
        assert common_lib.get_source_api_url(key) == value


def test_get_source_api_url_raises_error_for_unmapped_env():
    try:
        common_lib.get_source_api_url('not-an-env')
    except ValueError:
        return
    assert "Should have raised a ValueError exception" == False
