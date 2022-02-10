import csv
import json
from os import environ, path
import re
import tempfile
import unittest

import boto3
from pymongo import MongoClient
from pymongo.collation import Collation, CollationStrength
import pytest
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import StaleElementReferenceException, ElementClickInterceptedException, NoSuchElementException, TimeoutException
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.expected_conditions import presence_of_element_located, element_to_be_clickable


MONGO_HOST = environ.get("MONGO_HOST", "mongo")
MONGO_PORT = environ.get("MONGO_PORT", 27017)
MONGO_DB = environ.get("MONGO_DB", "covid19")
MONGO_COLLECTION = environ.get("MONGO_COLLECTION", "cases")

LOCALSTACK_URL = environ.get("AWS_ENDPOINT", "http://localstack:4566")

RETRIEVAL_BUCKET_NAME = environ.get("RETRIEVAL_BUCKET_NAME", "gdh-sources")

MOCK_SOURCE_DATA_URL = environ.get("MOCK_SOURCE_DATA_SERVICE", "http://mock-source-data")
MOCK_SOURCE_DATA_PORT = environ.get("MOCK_SOURCE_DATA_PORT", 5001)
MOCK_SOURCE_DATA_ADDRESS = f"{MOCK_SOURCE_DATA_URL}:{MOCK_SOURCE_DATA_PORT}"

UI_ADDRESS = environ.get("CURATOR_UI_ADDRESS", "http://localhost:3002")
SIGN_IN_URL = f"{UI_ADDRESS}/signin"
CASE_DATA_URL = f"{UI_ADDRESS}/cases"

USER_EMAIL = environ.get("USER_EMAIL", "")
USER_PASSWORD = environ.get("USER_PASSWORD", "")

DELIMITERS = {".csv": ",", ".tsv": "\t"}

COUNTRIES = []

SELENIUM_OPTIONS = Options()
SELENIUM_OPTIONS.add_argument("--headless")
SELENIUM_OPTIONS.add_argument("--no-sandbox")
SELENIUM_OPTIONS.add_argument("--disable-gpu")
SELENIUM_OPTIONS.add_argument("--disable-dev-shm-usage")


def check_env() -> None:
	if not USER_EMAIL:
		raise ValueError("A user email must be set to run end-to-end tests")
	if not USER_PASSWORD:
		raise ValueError("A password must be set to run end-to-end tests")


def get_cases(s3_object_url: str) -> list:
	file_extension = path.splitext(s3_object_url)[1]
	cases = []
	with tempfile.NamedTemporaryFile() as file_object:
		try:
			download_file(s3_object_url, file_object)
			cases = read_cases(file_object, file_extension)
		except Exception as exc:
			raise Exception(f"An exception occurred while trying to get case data: {exc}")
	return cases


def download_file(s3_object_url: str, file_object: object) -> None:
	s3_client = boto3.client("s3", endpoint_url=LOCALSTACK_URL)
	try:
		with open(file_object.name, "wb") as f:
			s3_client.download_fileobj(Bucket=RETRIEVAL_BUCKET_NAME, Key=s3_object_url, Fileobj=f)
	except Exception as exc:
		raise Exception(f"An exception occurred while trying to download {s3_object_url} from S3: {exc}")


def read_cases(file_object: object, file_extension: str) -> list:
	if file_extension in [".csv", ".tsv"]:
		delimiter = DELIMITERS.get(file_extension)
		return read_csv_or_tsv(file_object, delimiter)
	elif file_extension == ".json":
		return read_json(file_object)
	raise Exception(f"Invalid file extension: {file_extension}")


def read_csv_or_tsv(file_object: object, delimiter: str) -> list:
	cases = []
	try:
		with open(file_object.name, "r") as f:
			reader = csv.reader(f, delimiter=delimiter)
			# Skip the header
			next(reader)
			for row in reader:
				cases.append(row)
	except Exception as exc:
		raise Exception(f"An exception occurred while trying to read cases from csv/tsv: {exc}")
	return cases


def read_json(file_object: object) -> list:
	try:
		with open(file_object.name, "r") as f:
			data = f.read()
			return json.loads(data)
	except Exception as exc:
		raise Exception(f"An exception occurred while trying to read cases from json: {exc}")


def extract_cuba_cases(case_data):
	cases = []
	dated_cases = case_data.get("casos", {})
	case_days = dated_cases.get("dias", {})
	for _, val in case_days.items():
		cases.extend(val.get("diagnosticados", []))
	return cases


def sign_in(driver: object) -> None:
	if already_logged_in(driver):
		return
	driver.get(SIGN_IN_URL)
	WebDriverWait(driver, 1)
	close_cookie_popup(driver)
	WebDriverWait(driver, 1)
	if page_contains_confirmation_fields(driver):
		find_and_click(driver, "span", "Sign in!")
	WebDriverWait(driver, 30).until(
		presence_of_element_located((By.ID, "email"))
	)
	driver.find_element(By.ID, "email").send_keys(USER_EMAIL)
	driver.find_element(By.ID, "password").send_keys(USER_PASSWORD)
	driver.find_element(By.CLASS_NAME, "MuiButton-label").click()


def sign_up(driver: object) -> None:
	driver.get(SIGN_IN_URL)
	WebDriverWait(driver, 1)
	close_cookie_popup(driver)
	if not page_contains_confirmation_fields(driver):
		find_and_click(driver, "span", "Sign up!")
	WebDriverWait(driver, 30).until(
		presence_of_element_located((By.ID, "email"))
	)
	driver.find_element(By.ID, "email").send_keys(USER_EMAIL)
	driver.find_element(By.ID, "confirmEmail").send_keys(USER_EMAIL)
	driver.find_element(By.ID, "password").send_keys(USER_PASSWORD)
	driver.find_element(By.ID, "passwordConfirmation").send_keys(USER_PASSWORD)
	driver.find_element(By.ID, "isAgreementChecked").click()
	driver.find_element(By.CLASS_NAME, "MuiButton-label").click()


def close_cookie_popup(driver: object) -> None:
	try:
		WebDriverWait(driver, 30).until(
			element_to_be_clickable((By.CLASS_NAME, "iubenda-cs-close-btn"))
		).click()
	except (StaleElementReferenceException, ElementClickInterceptedException, NoSuchElementException) as exc:
		print(f"Error trying to close cookie popup: {exc}")


def find_and_click(driver: object, element_type: str, text: str) -> None:
	elements = driver.find_elements(By.TAG_NAME, element_type)
	attempts = 0
	while attempts < 5:
		for el in elements:
			if text in el.text:
				try:
					el.click()
					return
				except (StaleElementReferenceException, ElementClickInterceptedException):
					attempts += 1
					WebDriverWait(driver, 2)
	raise Exception(f"Could not find {element_type} containing {text} link on page")


def already_logged_in(driver: object) -> bool:
	try:
		driver.find_element(By.CLASS_NAME, "filter-button")
		return True
	except NoSuchElementException:
		return False


def page_contains_confirmation_fields(driver: object) -> bool:
	try:
		driver.find_element(By.ID, "confirmEmail")
		driver.find_element(By.ID, "passwordConfirmation")
		return True
	except NoSuchElementException:
		return False


@pytest.fixture
def mongo() -> object:
	return get_collection()


def get_countries() -> list:

	global COUNTRIES
	if COUNTRIES:
		return COUNTRIES

	col = get_collection()

	try:
		COUNTRIES = col.distinct("location.country")
	except Exception as exc:
		raise Exception(f"An exception occurred while retrieving distinct countries: {exc}")
	return COUNTRIES


def get_collection():
	client = MongoClient(MONGO_HOST, MONGO_PORT)
	db = client[MONGO_DB]
	collection = db[MONGO_COLLECTION]
	return collection


def get_country_records(collection: object, country: str) -> list:
	try:
		return list(collection.find({"location.country": country}).collation(Collation(locale="en_US", strength=CollationStrength.SECONDARY)))
	except Exception as exc:
		raise Exception(f"An exception occurred while trying to query the database: {exc}")


def list_some_cases(mongo: object, country: str) -> None:
	try:
		records = list(mongo.find({"location.country": country, "list": {"$exists": False}}).collation(Collation(locale="en_US", strength=CollationStrength.SECONDARY)))
		mid_index = len(records) // 2
		for _ in range(mid_index):
			mongo.update_one({"location.country": country, "list": {"$exists": False}}, {"$set": {"list": True}})
	except Exception as exc:
		raise Exception(f"An exception occurred while trying to add `list:true` to cases: {exc}")


class TestE2E():

	@classmethod
	def setup_class(cls):
		check_env()
		with webdriver.Firefox(options=SELENIUM_OPTIONS) as driver:
			sign_up(driver)

	@pytest.mark.skip("Not all ingestors working locally")		
	def test_all_cases_ingested(self, mongo):
		source_data_files = []
		response = requests.get(f"{MOCK_SOURCE_DATA_ADDRESS}/sources")

		sources = response.json()
		for _, val in sources.items():
			if s3_object_location := val.get("origin", {}).get("url"):
				source_data_files.append(s3_object_location)

		files_case_count = 0
		for source_file in source_data_files:
			file_name = source_file.split("/")[-1]
			cases = get_cases(file_name)
			files_case_count += len(cases)

		db_case_count = 0
		try:
			db_case_count = mongo.count_documents({})
		except Exception as exc:
			raise Exception(f"An exception occurred while trying to count case documents: {exc}")

		assert files_case_count == db_case_count

	@pytest.mark.parametrize("country", get_countries())
	def test_cases_in_db(self, mongo, country):
		# TODO: update this for countries with multiple sources
		records = get_country_records(mongo, country)
		response = requests.get(f"{MOCK_SOURCE_DATA_ADDRESS}/names")
		response = requests.get(f"{MOCK_SOURCE_DATA_ADDRESS}/names/{country.lower()}")
		source_id = response.text
		response = requests.get(f"{MOCK_SOURCE_DATA_ADDRESS}/sources/{source_id}")
		source_details = response.json()
		source_file = source_details.get("origin", {}).get("url")
		file_name = source_file.split("/")[-1]
		case_data = get_cases(file_name)
		cases = []
		if country == "Cuba":
			cases = extract_cuba_cases(case_data)
		else:
			cases = case_data
		assert len(records) == len(cases)

	@pytest.mark.parametrize("country", get_countries())
	def test_cases_geocoded(self, mongo, country):
		records = []
		try:
			records = get_country_records(mongo, country)
		except Exception as exc:
			raise Exception(f"An exception occurred while trying to query the database: {exc}")
		for record in records:
			assert record.get("location", {}).get("geometry")

	@pytest.mark.parametrize("country", get_countries())
	def test_listed_cases_show_on_ui(self, mongo, country):
		# Cases in database with list:true should show in UI
		# Cases in database without list:true should not show in UI
		list_some_cases(mongo, country)
		db_case_ids = []
		try:
			records = list(mongo.find({"location.country": country, "list": True}).collation(Collation(locale="en_US", strength=CollationStrength.SECONDARY)))
			db_case_ids = [record.get("_id") for record in records]
		except Exception as exc:
			raise Exception(f"An exception occurred while trying to query the database: {exc}")
		with webdriver.Firefox(options=SELENIUM_OPTIONS) as driver:
			sign_in(driver)

			try:
				WebDriverWait(driver, 10).until(
					element_to_be_clickable((By.ID, "sort-by-select"))
				)
			except (StaleElementReferenceException, TimeoutException):
				body = driver.find_element(By.TAG_NAME, "body").text
				print(f"Body: {body}")
				WebDriverWait(driver, 10).until(
					element_to_be_clickable((By.ID, "sort-by-select"))
				)

			regexp = re.compile(r"[a-z0-9]{24}\s\d{4}-\d{2}-\d{2}")

			table_rows = driver.find_elements(By.TAG_NAME, "tr")
			visible_rows = []
			for row in table_rows:
				if regexp.search(row.text) and country in row.text:
					visible_rows.append(row)

			# TODO: load more rows?...click "next page" span until at end

			assert len(db_case_ids) == len(visible_rows)
