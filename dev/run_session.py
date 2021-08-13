#!/usr/bin/env python3

import csv
import json
from os import environ, path, remove
from typing import List

from requests import post, Session


UI_ADDRESS = "http://localhost:3002"
API_ADDRESS = "http://localhost:3001"
SIGN_UP_URL = f"{UI_ADDRESS}/auth/signup"
SIGN_IN_URL = f"{UI_ADDRESS}/auth/signin"
ASYNC_DL_URL = f"{API_ADDRESS}/api/cases/downloadAsync"
CLIENT_EMAIL = environ.get("CLIENT_EMAIL", "fake@fake.fake")
CLIENT_PASSWORD = environ.get("CLIENT_PASSWORD", "password")

SIGN_UP_PAYLOAD = {
    "email": CLIENT_EMAIL,
    "password": CLIENT_PASSWORD,
    "isAgreementChecked": True,
    "isNewsletterChecked": False
}

SIGN_IN_PAYLOAD = SIGN_UP_PAYLOAD.copy()
SIGN_IN_PAYLOAD.update({
    "confirmEmail": CLIENT_EMAIL,
    "passwordConfirmation": CLIENT_PASSWORD 
})

# TODO: add special case for all.csv (redirected to another endpoint)
DOWNLOADS = {
    "france.json": {"format": "json", "query": "country:France"},
    "france.csv": {"format": "csv", "query": "country:France"},
    "france.tsv": {"format": "tsv", "query": "country:France"},
    "all.json": {"format": "json"},
    "all.tsv": {"format": "tsv"}
}

FIELDS_FILE = "../data-serving/scripts/export-data/functions/01-split/fields.txt"


def sign_up(session: Session) -> None:
    print(f"Signing up using email {CLIENT_EMAIL}")
    response = session.post(SIGN_UP_URL, json=SIGN_UP_PAYLOAD)
    print(response)
    print(response.text)


def sign_in(session: Session) -> None:
    print(f"Signing in using email {CLIENT_EMAIL}")
    response = session.post(SIGN_IN_URL, json=SIGN_IN_PAYLOAD)
    print(response)
    print(response.text)


def download_cases(session: Session) -> None:
    print("Downloading cases")
    for file_name, payload in DOWNLOADS.items():
        print(f"Requesting cases for {payload}")
        response = session.post(ASYNC_DL_URL, json=payload)
        print(f"Saving to file {file_name}")
        with open(file_name, "wb") as f:
            for chunk in response.iter_content(chunk_size=128):
                f.write(chunk)


def load_case_fields() -> List[str]:
    with open(FIELDS_FILE) as f:
        contents = f.read()
        return contents.splitlines()


def check_files(fields: List[str]) -> None:
    print("Checking files for proper format and contents")
    for file_name, payload in DOWNLOADS.items():
        extension = payload.get("format", "txt")
        function = FILE_CHECKERS.get(extension, None)
        if not function:
            raise Exception(f"No function for file {name}.{extension}")
        print(f"Checking {file_name}")
        function(file_name, fields)


def check_json(file_name: str, fields: List[str]) -> None:
    with open(file_name) as json_file:
        case_data = json.load(json_file)
        check_case_data(case_data, fields)


def check_csv(file_name: str, fields: List[str]) -> None:
    case_data = []
    with open(file_name) as csv_file:
        reader = csv.DictReader(csv_file, delimiter=",")
        for row in reader:
            case_data.append(row)
    check_case_data(case_data, fields)


def check_tsv(file_name: str, fields: List[str]) -> None:
    case_data = []
    with open(file_name) as tsv_file:
        reader = csv.DictReader(tsv_file, delimiter="\t")
        for row in reader:
            case_data.append(row)
    check_case_data(case_data, fields)


def check_case_data(case_data: List[dict], fields: List[str]) -> None:
    if not isinstance(case_data, list):
        raise Exception("Case data should be a list of cases")
    if len(case_data) < 1:
        raise Exception("Case data should contain at least one case")
    data_fields = list(case_data[0].keys())
    if data_fields.sort() != fields:
        raise Exception("Case data should contain expected fields")


def cleanup_files() -> None:
    print("Cleaning up files")
    for file_name in DOWNLOADS:
        if path.exists(file_name):
            print(f"Removing {file_name}")
            remove(file_name)


FILE_CHECKERS = {
    "json": check_json,
    "csv": check_csv,
    "tsv": check_tsv
}

if __name__ == "__main__":
    print("Creating a new user, logging in, and downloading cases")
    try:
        session = Session()
        sign_up(session)
        sign_in(session)
        download_cases(session)
        case_fields = load_case_fields().sort()
        check_files(case_fields)
    except Exception as exc:
       print(f"An exception occurred: {exc}")
       raise
    finally:
        session.close()
        cleanup_files()
    print("User creation, login, and case downloads succeeded")

