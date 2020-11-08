import os
import boto3
import tempfile
import google
from typing import Dict
import google.auth.transport.requests

from google.oauth2 import service_account
from locust import HttpUser, task, between

s3_client = boto3.client("s3")


def obtain_api_credentials(s3_bucket, s3_object):
    """
    Creates HTTP headers credentialed for access to the Global.health API.
    """
    try:
        with tempfile.NamedTemporaryFile() as local_creds_file:
            s3_client.download_file(s3_bucket,
                                    s3_object,
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


class LoadTestUser(HttpUser):
    # Wait between 1 and 2 seconds between each task.
    wait_time = between(1, 2)

    def __init__(self, env):
        super(LoadTestUser, self).__init__(env)
        self.headers: Dict = None

    # Weight of 10, we expect most folks to spend time on the line list.
    @task(10)
    def cases(self):
        self.client.get("/api/cases", headers=self.headers)

    @task(2)
    def uploads(self):
        self.client.get("/api/sources/uploads", headers=self.headers)

    @task(2)
    def sources(self):
        self.client.get("/api/sources", headers=self.headers)

    @task
    def users(self):
        self.client.get("/api/users", headers=self.headers)

    @task
    def profile(self):
        self.client.get("/auth/profile", headers=self.headers)

    def on_start(self):
        self.headers = obtain_api_credentials(
            os.environ['S3_BUCKET'], os.environ['S3_OBJECT'])
