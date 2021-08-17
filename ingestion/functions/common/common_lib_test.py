import pytest
import requests

from common import common_lib
from unittest.mock import patch

_SOURCE_API_URL = "https://foo.bar"
_SOURCE_ID = "abc123"
_UPLOAD_ID = "123456789012345678901234"


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
    requests_mock.post(
        create_upload_url,
        json={"_id": _UPLOAD_ID, "status": "IN_PROGRESS", "summary": {}},
        status_code=201)

    response = common_lib.create_upload_record("env", _SOURCE_ID, {}, {})

    assert requests_mock.request_history[0].url == create_upload_url
    assert response == _UPLOAD_ID


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
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{_UPLOAD_ID}"
    num_created = 42
    num_updated = 0
    requests_mock.put(
        update_upload_url,
        json={"_id": _UPLOAD_ID, "status": "SUCCESS",
              "summary": {"numCreated": num_created, "numUpdated": num_updated}})

    common_lib.finalize_upload(
        "env", _SOURCE_ID, _UPLOAD_ID, {}, {}, num_created, num_updated)

    assert requests_mock.request_history[0].url == update_upload_url


def test_finalize_upload_raises_error_for_failed_request(
        requests_mock, mock_source_api_url_fixture):
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{_UPLOAD_ID}"
    requests_mock.register_uri(
        "PUT",
        update_upload_url,
        [{"status_code": 500}])

    status, _ = common_lib.finalize_upload("env", _SOURCE_ID, _UPLOAD_ID, {}, {}, 42, 0)
    if status == 500:
        assert len(requests_mock.request_history) == 1
        assert requests_mock.request_history[0].url == update_upload_url
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
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{_UPLOAD_ID}"
    requests_mock.put(update_upload_url, json={})
    e = ValueError("Oops!")

    try:
        upload_error = common_lib.UploadError.SOURCE_CONFIGURATION_ERROR
        common_lib.complete_with_error(
            e, "env", upload_error, _SOURCE_ID, _UPLOAD_ID, {}, {})
    except ValueError:
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": upload_error.name}}
        return
    # We got the wrong exception or no exception, fail the test.
    assert not "Should have raised a ValueError exception"


def test_get_source_api_url_returns_mapped_value():
    for key, value in common_lib._ENV_TO_SOURCE_API_URL.items():
        assert common_lib.get_source_api_url(key) == value


def test_get_source_api_url_raises_error_for_unmapped_env():
    try:
        common_lib.get_source_api_url('not-an-env')
    except ValueError:
        return
    assert not "Should have raised a ValueError exception"


def test_get_parser_module():
    parser = "japan-japan-ingestor-test"
    exp = "parsing.japan.japan"
    act = common_lib.get_parser_module(parser)
    assert exp == act
