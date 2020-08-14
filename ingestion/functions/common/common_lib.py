# Common utilities between parsing and retrieval lambdas.

import tempfile

import google
from google.oauth2 import service_account

_SERVICE_ACCOUNT_CRED_FILE = "covid-19-map-277002-0943eeb6776b.json"
_METADATA_BUCKET = "epid-ingestion"

def obtain_api_credentials(s3_client):
    """
    Creates HTTP headers credentialed for access to the Global Health Source API.
    """
    try:
        with tempfile.NamedTemporaryFile() as local_creds_file:
            print(
                "Retrieving service account credentials from "
                f"s3://{_METADATA_BUCKET}/{_SERVICE_ACCOUNT_CRED_FILE}")
            s3_client.download_file(
                _METADATA_BUCKET, _SERVICE_ACCOUNT_CRED_FILE, local_creds_file.name)
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