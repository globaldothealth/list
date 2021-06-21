# Tests for the parsing library common logic.
# If you come from a unittest background and wonder at how requests_mock
# arrives by magic here, check out
# https://requests-mock.readthedocs.io/en/latest/pytest.html?highlight=pytest#pytest
import boto3
import copy
import json
import os
import pytest
import sys
import tempfile
import datetime

from unittest.mock import MagicMock, patch

try:
    from parsing_lib import s3_client
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from parsing_lib import s3_client

try:
    import common_lib
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    import common_lib

_SOURCE_API_URL = "http://bar.baz"
_SOURCE_ID = "5f0b9a7ead3a2b003edc0e7f"
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
    return iter([_PARSED_CASE])


@pytest.fixture()
def mock_source_api_url_fixture():
    """
    Supplies a predetermined endpoint for G.h HTTP requests.

    Return the common_lib module, for any case-specific mocks.

    Because the parsing library is imported locally, this fixture can't
    be set to autouse.
    """
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir,
            os.pardir,
            os.pardir,
            os.pardir,
            'common'))
    import common_lib  # pylint: disable=import-error
    with patch('common_lib.get_source_api_url') as mock:
        mock.return_value = _SOURCE_API_URL
        yield common_lib


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


class FakeContext:
    def get_remaining_time_in_millis(self):
        return 42


@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
def test_e2e(
    input_event, sample_data, requests_mock,
        mock_source_api_url_fixture):
    import parsing_lib  # Import locally to avoid superseding mock
    common_lib = mock_source_api_url_fixture
    common_lib.login = MagicMock(name="login")

    s3_client.put_object(
        Bucket=input_event[parsing_lib.S3_BUCKET_FIELD],
        Key=input_event[parsing_lib.S3_KEY_FIELD],
        Body=json.dumps(sample_data))

    # Mock the batch upsert call.
    # TODO: Complete removal of URL env var.
    os.environ["SOURCE_API_URL"] = _SOURCE_API_URL
    full_source_url = f"{_SOURCE_API_URL}/cases/batchUpsert"
    num_created = 10
    num_updated = 5
    requests_mock.post(
        full_source_url,
        json={"numCreated": num_created,
              "numUpdated": num_updated})
    source_info_url = f"{_SOURCE_API_URL}/sources/{input_event['sourceId']}"
    requests_mock.get(
        source_info_url,
        json={
            "hasStableIdentifiers": True
        }
    )

    # Delete the provided upload ID to force parsing_lib to create a new upload.
    # Mock the create and update upload calls.
    del input_event[parsing_lib.UPLOAD_ID_FIELD]
    base_upload_url = f"{_SOURCE_API_URL}/sources/{input_event['sourceId']}/uploads"
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

    # Mock the excluded case IDs endpoint call.
    start_date = input_event[parsing_lib.DATE_RANGE_FIELD]["start"]
    end_date = input_event[parsing_lib.DATE_RANGE_FIELD]["end"]
    excluded_case_ids_url = f"{_SOURCE_API_URL}/excludedCaseIds?sourceId={_SOURCE_ID}&dateFrom={start_date}&dateTo={end_date}"
    requests_mock.register_uri(
                "GET", excluded_case_ids_url,
                [{"json": {"cases": []},
                  "status_code": 200}])

    response = parsing_lib.run(input_event, fake_parsing_fn)

    assert requests_mock.request_history[0].url == create_upload_url
    assert requests_mock.request_history[1].url == source_info_url
    assert requests_mock.request_history[2].url == excluded_case_ids_url
    assert requests_mock.request_history[3].url == full_source_url
    assert requests_mock.request_history[4].url == update_upload_url
    assert response["count_created"] == num_created
    assert response["count_updated"] == num_updated


@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
def test_e2e_with_unstable_case_ids(
    input_event, sample_data, requests_mock,
        mock_source_api_url_fixture):
    import parsing_lib  # Import locally to avoid superseding mock
    common_lib = mock_source_api_url_fixture
    common_lib.login = MagicMock(name="login")

    s3_client.put_object(
        Bucket=input_event[parsing_lib.S3_BUCKET_FIELD],
        Key=input_event[parsing_lib.S3_KEY_FIELD],
        Body=json.dumps(sample_data))

    # Mock the batch upsert call.
    # TODO: Complete removal of URL env var.
    os.environ["SOURCE_API_URL"] = _SOURCE_API_URL
    full_source_url = f"{_SOURCE_API_URL}/cases/batchUpsert"
    num_created = 10
    num_updated = 5
    requests_mock.post(
        full_source_url,
        json={"numCreated": num_created,
              "numUpdated": num_updated})
    source_info_url = f"{_SOURCE_API_URL}/sources/{input_event['sourceId']}"
    requests_mock.get(
        source_info_url,
        json={
            "hasStableIdentifiers": False
        }
    )
    mark_pending_url = f"{source_info_url}/markPendingRemoval"
    remove_pending_url = f"{source_info_url}/removePendingCases"
    requests_mock.post(
        mark_pending_url
    )
    requests_mock.post(
        remove_pending_url
    )

    # Delete the provided upload ID to force parsing_lib to create a new upload.
    # Mock the create and update upload calls.
    del input_event[parsing_lib.UPLOAD_ID_FIELD]
    base_upload_url = f"{_SOURCE_API_URL}/sources/{input_event['sourceId']}/uploads"
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

    # Mock the excluded case IDs endpoint call.
    start_date = input_event[parsing_lib.DATE_RANGE_FIELD]["start"]
    end_date = input_event[parsing_lib.DATE_RANGE_FIELD]["end"]
    excluded_case_ids_url = f"{_SOURCE_API_URL}/excludedCaseIds?sourceId={_SOURCE_ID}&dateFrom={start_date}&dateTo={end_date}"
    requests_mock.register_uri(
                "GET", excluded_case_ids_url,
                [{"json": {"cases": []},
                  "status_code": 200}])

    response = parsing_lib.run(input_event, fake_parsing_fn)

    assert requests_mock.request_history[0].url == create_upload_url
    assert requests_mock.request_history[1].url == source_info_url
    assert requests_mock.request_history[2].url == mark_pending_url
    assert requests_mock.request_history[3].url == excluded_case_ids_url
    assert requests_mock.request_history[4].url == full_source_url
    assert requests_mock.request_history[5].url == update_upload_url
    assert requests_mock.request_history[6].url == remove_pending_url
    assert response["count_created"] == num_created
    assert response["count_updated"] == num_updated


def test_batch_of():
    import parsing_lib  # Import locally to avoid superseding mock
    items = iter([1, 2, 3, 4, 5])
    assert parsing_lib.batch_of(items, 3) == [1, 2, 3]
    assert parsing_lib.batch_of(items, 3) == [4, 5]
    assert parsing_lib.batch_of(items, 3) == []


@pytest.mark.skipif(not os.environ.get("DOCKERIZED", False),
                    reason="Running integration tests outside of mock environment disabled")
def test_retrieve_raw_data_file_stores_s3_in_local_file(input_event, sample_data):
    import parsing_lib  # Import locally to avoid superseding mock
    s3_client.put_object(
        Bucket=input_event[parsing_lib.S3_BUCKET_FIELD],
        Key=input_event[parsing_lib.S3_KEY_FIELD],
        Body=json.dumps(sample_data))

    fd, fname = tempfile.mkstemp()
    with os.fdopen(fd, "wb") as f:
        parsing_lib.retrieve_raw_data_file(
            input_event[parsing_lib.S3_BUCKET_FIELD],
            input_event[parsing_lib.S3_KEY_FIELD],
            f)
        f.flush()
        with open(fname, "r") as f:
            assert json.load(f) == sample_data
    if os.path.exists(fname):
        os.remove(fname)


def test_extract_event_fields_returns_all_present_fields(input_event):
    import parsing_lib  # Import locally to avoid superseding mock
    assert parsing_lib.extract_event_fields(input_event) == (
        input_event[parsing_lib.ENV_FIELD],
        input_event[parsing_lib.SOURCE_URL_FIELD],
        input_event[parsing_lib.SOURCE_ID_FIELD],
        input_event[parsing_lib.UPLOAD_ID_FIELD],
        input_event[parsing_lib.S3_BUCKET_FIELD],
        input_event[parsing_lib.S3_KEY_FIELD],
        None,
        input_event[parsing_lib.DATE_RANGE_FIELD],
        input_event[parsing_lib.AUTH_FIELD])


def test_extract_event_fields_errors_if_missing_bucket_field(input_event):
    import parsing_lib  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=parsing_lib.S3_BUCKET_FIELD):
        del input_event[parsing_lib.S3_BUCKET_FIELD]
        parsing_lib.extract_event_fields(input_event)


def test_extract_event_fields_errors_if_missing_key_field(input_event):
    import parsing_lib  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=parsing_lib.S3_KEY_FIELD):
        del input_event[parsing_lib.S3_KEY_FIELD]
        parsing_lib.extract_event_fields(input_event)


def test_extract_event_fields_errors_if_missing_env_field(input_event):
    import parsing_lib  # Import locally to avoid superseding mock
    with pytest.raises(ValueError, match=parsing_lib.ENV_FIELD):
        del input_event[parsing_lib.ENV_FIELD]
        parsing_lib.extract_event_fields(input_event)


def test_prepare_cases_adds_upload_id():
    import parsing_lib  # Import locally to avoid superseding mock
    case = copy.deepcopy(_PARSED_CASE)
    upload_id = "123456789012345678901234"
    result = parsing_lib.prepare_cases(
        [case],
        upload_id,
        [])
    assert next(result)["caseReference"]["uploadIds"] == [upload_id]


def test_prepare_cases_removes_nones():
    import parsing_lib  # Import locally to avoid superseding mock
    case = copy.deepcopy(_PARSED_CASE)
    case["demographics"] = None
    result = parsing_lib.prepare_cases(
        [case],
        "123456789012345678901234",
        [])
    assert "demographics" not in next(result).keys()


def test_prepare_cases_removes_empty_strings():
    import parsing_lib  # Import locally to avoid superseding mock
    case = copy.deepcopy(_PARSED_CASE)
    case["notes"] = ""
    result = parsing_lib.prepare_cases(
        [case],
        "123456789012345678901234",
        [])
    assert "notes" not in next(result).keys()


def test_write_to_server_returns_created_and_updated_count(
        requests_mock, mock_source_api_url_fixture):
    import parsing_lib  # Import locally to avoid superseding mock
    full_source_url = f"{_SOURCE_API_URL}/cases/batchUpsert"
    num_created = 10
    num_updated = 5
    requests_mock.post(
        full_source_url,
        json={"numCreated": num_created,
              "numUpdated": num_updated})

    count_created, count_updated = parsing_lib.write_to_server(
        iter([_PARSED_CASE]),
        "env", _SOURCE_ID, "upload_id", {},
        {},
        parsing_lib.CASES_BATCH_SIZE)
    assert requests_mock.request_history[0].url == full_source_url
    assert count_created == num_created
    assert count_updated == num_updated


def test_write_to_server_raises_error_for_failed_batch_upsert(
        requests_mock, mock_source_api_url_fixture):
    import parsing_lib  # Import locally to avoid superseding mock
    # TODO: Complete removal of URL env var.
    os.environ["SOURCE_API_URL"] = _SOURCE_API_URL
    full_source_url = f"{_SOURCE_API_URL}/cases/batchUpsert"
    requests_mock.register_uri(
        "POST", full_source_url,
        [{"json": {"numCreated": 1, "numUpdated": 0},
          "status_code": 200},
         {"json": {},
          "status_code": 500}])
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.register_uri("PUT", update_upload_url, json={})

    try:
        parsing_lib.write_to_server(
            iter([_PARSED_CASE, _PARSED_CASE]),
            "env", _SOURCE_ID, upload_id, {}, {}, 1)
    except RuntimeError:
        assert requests_mock.request_history[0].url == full_source_url
        assert requests_mock.request_history[1].url == full_source_url
        assert requests_mock.request_history[-1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.DATA_UPLOAD_ERROR.name, 'numCreated': 1}}
        return
    # We got the wrong exception or no exception, fail the test.
    assert False


def test_write_to_server_raises_error_for_failed_batch_upsert_with_validation_errors(
        requests_mock, mock_source_api_url_fixture):
    import parsing_lib  # Import locally to avoid superseding mock
    # TODO: Complete removal of URL env var.
    os.environ["SOURCE_API_URL"] = _SOURCE_API_URL
    full_source_url = f"{_SOURCE_API_URL}/cases/batchUpsert"
    requests_mock.register_uri(
        "POST", full_source_url, json={ 
            'numCreated': 0,
            'numUpdated': 0,
        }, status_code=207),
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.register_uri("PUT", update_upload_url, json={})

    try:
        parsing_lib.write_to_server(
            iter([_PARSED_CASE]),
            "env", _SOURCE_ID, upload_id, {},
            {},
            parsing_lib.CASES_BATCH_SIZE)
    except RuntimeError:
        assert requests_mock.request_history[0].url == full_source_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.VALIDATION_ERROR.name}}
        return
    # We got the wrong exception or no exception, fail the test.
    assert False


def test_write_to_server_records_input_for_failed_batch_upsert_with_validation_errors(
        requests_mock, mock_source_api_url_fixture):
    import parsing_lib  # Import locally to avoid superseding mock
    # TODO: Complete removal of URL env var.
    os.environ["SOURCE_API_URL"] = _SOURCE_API_URL
    full_source_url = f"{_SOURCE_API_URL}/cases/batchUpsert"
    requests_mock.register_uri(
        "POST", full_source_url, json={
            'errors': [
                {
                    'index': 0,
                    'message': 'You done goofed.',
                },
            ],
            'numCreated': 0,
            'numUpdated': 0,
        }, status_code=207),
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.register_uri("PUT", update_upload_url, json={})

    try:
        parsing_lib.write_to_server(
            iter([_PARSED_CASE]),
            "env", _SOURCE_ID, upload_id, {},
            {},
            parsing_lib.CASES_BATCH_SIZE)
    except RuntimeError as e:
        assert requests_mock.request_history[0].url == full_source_url
        assert requests_mock.request_history[1].url == update_upload_url
        assert requests_mock.request_history[-1].json(
        ) == {"status": "ERROR", "summary": {"error": common_lib.UploadError.VALIDATION_ERROR.name}}
        assert e.args[0].find('Hanuman Nagar, Darbhanga, Bihar, India') != -1
        return
    # We got the wrong exception or no exception, fail the test.
    assert False


@patch('parsing_lib.get_today')
def test_filter_cases_by_date_keeps_exact_with_EQ(mock_today):
    import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 8)
    cases = parsing_lib.filter_cases_by_date(
        [CASE_JUNE_FIFTH],
        {"numDaysBeforeToday": 3, "op": "EQ"},
        None,
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert list(cases) == [CASE_JUNE_FIFTH]


@patch('parsing_lib.get_today')
def test_filter_cases_by_date_removes_nonexact_with_EQ(mock_today):
    import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 10, 10)
    cases = parsing_lib.filter_cases_by_date(
        [CASE_JUNE_FIFTH],
        {"numDaysBeforeToday": 3, "op": "EQ"},
        None,
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert not next(cases, None)


@patch('parsing_lib.get_today')
def test_filter_cases_by_date_removes_exact_with_LT(mock_today):
    import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 8)
    cases = parsing_lib.filter_cases_by_date(
        [CASE_JUNE_FIFTH],
        {"numDaysBeforeToday": 3, "op": "LT"},
        None,
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert not next(cases, None)


@patch('parsing_lib.get_today')
def test_filter_cases_by_date_keeps_before_LT(mock_today):
    import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 10)
    cases = parsing_lib.filter_cases_by_date(
        (CASE_JUNE_FIFTH,),
        {"numDaysBeforeToday": 3, "op": "LT"},
        None,
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert next(cases) == CASE_JUNE_FIFTH


@patch('parsing_lib.get_today')
def test_filter_cases_by_date_removes_exact_with_GT(mock_today):
    import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 8)
    cases = parsing_lib.filter_cases_by_date(
        [CASE_JUNE_FIFTH],
        {"numDaysBeforeToday": 3, "op": "GT"},
        None,
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert not next(cases, None)


@patch('parsing_lib.get_today')
def test_filter_cases_by_date_keeps_after_GT(mock_today):
    import parsing_lib  # Import locally to avoid superseding mock
    mock_today.return_value = datetime.datetime(2020, 6, 7)
    cases = parsing_lib.filter_cases_by_date(
        (CASE_JUNE_FIFTH,),
        {"numDaysBeforeToday": 3, "op": "GT"},
        None,
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert next(cases) == CASE_JUNE_FIFTH


def test_filter_cases_by_date_unsupported_op(
        requests_mock, mock_source_api_url_fixture):
    import parsing_lib  # Import locally to avoid superseding mock
    upload_id = "123456789012345678901234"
    update_upload_url = f"{_SOURCE_API_URL}/sources/{_SOURCE_ID}/uploads/{upload_id}"
    requests_mock.put(
        update_upload_url,
        json={"_id": upload_id, "status": "ERROR",
              "summary": {"error": "SOURCE_CONFIGURATION_ERROR"}})

    try:
        next(parsing_lib.filter_cases_by_date(
            [CASE_JUNE_FIFTH],
            {"numDaysBeforeToday": 3, "op": "NOPE"},
            None,
            "env", _SOURCE_ID, upload_id, {}, {}))  # api_creds
    except ValueError as ve:
        assert "NOPE" in str(ve)
        assert requests_mock.request_history[0].url == update_upload_url
        assert requests_mock.request_history[-1].json() == {"status": "ERROR", "summary": {
            "error": "SOURCE_CONFIGURATION_ERROR"}}
        return
    assert not "Should have raised a ValueError exception"


def test_filter_cases_by_date_within_range():
    import parsing_lib  # Import locally to avoid superseding mock
    cases = parsing_lib.filter_cases_by_date(
        (CASE_JUNE_FIFTH,),
        None,
        {"start": "2020-06-04", "end": "2020-06-06"},
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert next(cases) == CASE_JUNE_FIFTH


def test_filter_cases_by_date_equals_range():
    import parsing_lib  # Import locally to avoid superseding mock
    cases = parsing_lib.filter_cases_by_date(
        (CASE_JUNE_FIFTH,),
        None,
        {"start": "2020-06-05", "end": "2020-06-05"},
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert next(cases) == CASE_JUNE_FIFTH


def test_filter_cases_by_date_outside_range():
    import parsing_lib  # Import locally to avoid superseding mock
    cases = parsing_lib.filter_cases_by_date(
        (CASE_JUNE_FIFTH,),
        None,
        {"start": "2020-06-03", "end": "2020-06-04"},
        "env", "source_id", "upload_id", {}, {})  # api_creds
    assert not next(cases, None)


def test_filter_cases_by_date_handles_two_date_formats():
    import parsing_lib  # Import locally to avoid superseding mock

    # Date format is %m/%d/%YZ in CASE_JUNE_FIFTH.
    # Date parsing also handles strings without the 'Z'.
    other_date_format_case = copy.deepcopy(
        CASE_JUNE_FIFTH)
    other_date_format_case["events"][0]["dateRange"]["start"] = "06/05/2020"
    other_date_format_case["events"][0]["dateRange"]["end"] = "06/05/2020"

    cases = parsing_lib.filter_cases_by_date(
        (CASE_JUNE_FIFTH, other_date_format_case),
        None,
        {"start": "2020-06-05", "end": "2020-06-05"},
        "env", "source_id", "upload_id", {}, {})  # api_creds

    assert next(cases) == CASE_JUNE_FIFTH
    assert next(cases) == other_date_format_case


def test_remove_nested_none_and_empty_removes_only_nones_and_empty_str():
    import parsing_lib  # Import locally to avoid superseding mock
    data = {"keep1": 0, "keep2": False, "keep3": [], "drop1": None,
            "multi": {"multikeep": "ok", "multidrop": None},
            "emptyobject": {"dropped": None},
            "emptystr": ""}
    expected = {"keep1": 0, "keep2": False, "keep3": [],
                "multi": {"multikeep": "ok"},
                "emptyobject": {}}
    assert parsing_lib.remove_nested_none_and_empty(data) == expected

def test_excluded_case_are_removed_from_cases():
    import parsing_lib  # Import locally to avoid superseding mock

    valid_case = copy.deepcopy(_PARSED_CASE)
    excluded_case = copy.deepcopy(_PARSED_CASE)
    excluded_case["caseReference"]["sourceEntryId"] = "999"

    cases = parsing_lib.prepare_cases([excluded_case, valid_case], "0", ["999"])
    cases_list = list(cases)
    assert len(cases_list) == 1
    assert cases_list[0]["caseReference"]["sourceEntryId"] == valid_case["caseReference"]["sourceEntryId"]
