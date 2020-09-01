"""
Common utilities between parsing and retrieval lambdas.

TODO: Considering structuring this as a class (if that's workable with AWS
Lambda layers). Many methods accept similar parameters, in order to accomplish
API calls, and it's information that could be easily encoded as state in an
object.
"""

import os
import tempfile
import requests

import google

from enum import Enum
from google.oauth2 import service_account

_ENV_TO_SOURCE_API_URL = {
    "local": "http://localhost:3001/api",
    "dev": "https://dev-curator.ghdsi.org/api",
    "prod": "https://curator.ghdsi.org/api"
}
_SERVICE_ACCOUNT_CRED_FILE = "covid-19-map-277002-0943eeb6776b.json"
_METADATA_BUCKET = "epid-ingestion"


class UploadError(Enum):
    """Upload error categories corresponding to the G.h Source API."""
    INTERNAL_ERROR = 1
    SOURCE_CONFIGURATION_ERROR = 2
    SOURCE_CONFIGURATION_NOT_FOUND = 3
    SOURCE_CONTENT_NOT_FOUND = 4
    SOURCE_CONTENT_DOWNLOAD_ERROR = 5
    PARSING_ERROR = 6
    DATA_UPLOAD_ERROR = 7
    VALIDATION_ERROR = 8


def create_upload_record(env, source_id, headers, cookies):
    """Creates an upload resource via the G.h Source API."""
    post_api_url = f"{get_source_api_url(env)}/sources/{source_id}/uploads"
    print(f"Creating upload via {post_api_url}")
    res = requests.post(post_api_url,
                        json={"status": "IN_PROGRESS", "summary": {}},
                        cookies=cookies,
                        headers=headers)
    if res and res.status_code == 201:
        res_json = res.json()
        return res_json["_id"]
    e = RuntimeError(
        f'Error creating upload record, status={res.status_code}, response={res.text}')
    complete_with_error(e)


def finalize_upload(
        env, source_id, upload_id, headers, cookies, count_created=None,
        count_updated=None, error=None):
    """Records the results of an upload via the G.h Source API."""
    put_api_url = f"{get_source_api_url(env)}/sources/{source_id}/uploads/{upload_id}"
    print(f"Updating upload via {put_api_url}")
    update = {
        "status": "ERROR", "summary": {"error": error.name}} if error else {
        "status": "SUCCESS",
        "summary": {"numCreated": count_created, "numUpdated": count_updated}}
    res = requests.put(put_api_url,
                       json=update,
                       headers=headers,
                       cookies=cookies)
    if not res or res.status_code != 200:
        raise RuntimeError(
            f'Error updating upload record, status={res.status_code}, response={res.text}')


def complete_with_error(
        exception, env=None, upload_error=None, source_id=None, upload_id=None,
        headers=None, cookies=None):
    """
    Logs and raises the provided exception.

    If upload details are provided, updates the indicated upload with the
    provided data.
    """
    print(exception)
    if env and upload_error and source_id and upload_id:
        finalize_upload(env, source_id, upload_id, headers, cookies,
                        error=upload_error)
    raise exception


def login(email: str):
    """Logs-in a local curator server instance for testing.

    Returns the cookie of the now logged-in user.
    """
    print('Logging-in user', email)
    endpoint = "http://localhost:3001/auth/register"
    res = requests.post(endpoint, json={
        "email": email,
        "roles": ['curator', 'reader'],
    })
    if not res or res.status_code != 200:
        raise RuntimeError(
            f'Error registering local user, status={res.status_code}, response={res.text}')
    return res.cookies


def obtain_api_credentials(s3_client):
    """
    Creates HTTP headers credentialed for access to the Global Health Source API.
    """
    try:
        with tempfile.NamedTemporaryFile() as local_creds_file:
            print(
                "Retrieving service account credentials from "
                f"s3://{_METADATA_BUCKET}/{_SERVICE_ACCOUNT_CRED_FILE}")
            s3_client.download_file(_METADATA_BUCKET,
                                    _SERVICE_ACCOUNT_CRED_FILE,
                                    local_creds_file.name)
            credentials = service_account.Credentials.from_service_account_file(
                local_creds_file.name, scopes=["email"])
            headers = {}
            request = google.auth.transport.requests.Request()
            credentials.refresh(request)
            credentials.apply(headers)
            return headers
    except Exception as e:
        print(e)
        raise e


def get_source_api_url(env):
    """
    Returns the URL at which to reach the Source API for the provided environment.
    """
    if env not in _ENV_TO_SOURCE_API_URL:
        raise ValueError(f"No source API URL found for provided env: {env}")
    return _ENV_TO_SOURCE_API_URL[env]
