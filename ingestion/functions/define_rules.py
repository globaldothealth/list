#!/usr/bin/env python3

# Need to run this from the directory containing this script and make_rules.py
# Run this script, then check output in the generated file, then run make_rules.py

import argparse
import json
import requests
import sys

import boto3
from slugify import slugify

import common.common_lib as common_lib


DEV = "dev"
PROD = "prod"

DEV_CURATOR_URL = "https://dev-data.covid-19.global.health/api/sources"
PROD_CURATOR_URL = "https://data.covid-19.global.health/api/sources"

ENV_TO_URL = {
	DEV: DEV_CURATOR_URL,
	PROD:PROD_CURATOR_URL
}

AWS_REGION = "us-east-1"

LIMIT = 100 # when we go over 100 sources we will need to update the maximum limit in the curator API

SOURCE_RULE = {
	"rule_name": "", 
	"target_name": "",
	"source_name": "", 
	"job_name": "",
	"description": ""
}

FILE_NAME = "rules.json"

JOB_DEF_ENV = "EPID_INGESTION_ENV"
JOB_DEF_SOURCE_ID = "EPID_INGESTION_SOURCE_ID"


parser = argparse.ArgumentParser(
	description="Define rules for AWS EventBridge by curator sources",
    usage="python define_rules.py [<environment>]"
)
parser.add_argument(
    "environment", help="Which environment to list sources from", choices=[DEV, PROD]
)

args = parser.parse_args(sys.argv[1:2])

s3_client = boto3.client("s3", AWS_REGION)

auth_headers = common_lib.obtain_api_credentials(s3_client)

env = args.environment
url = f"{ENV_TO_URL.get(env, '')}?limit={LIMIT}"

print(f"Getting source information from {env} curator API")

response = requests.get(url, headers=auth_headers)

if response.status_code != 200:
	print(f"Non-200 response from curator API: {response.status_code}")
	sys.exit(1)

sources = response.json().get("sources")

batch_client = boto3.client("batch", AWS_REGION)
resp = batch_client.describe_job_definitions()
job_definitions = resp.get("jobDefinitions")

if not job_definitions:
	print(f"No job definitions found in response from Batch: {resp}")
	sys.exit(1)

source_id_to_job_def_name = {}

for job_def in job_definitions:
	props = job_def.get("containerProperties", {})
	job_def_env = props.get("environment", {})
	for kv in job_def_env:
		print(f"key-val: {kv}")
		if kv.get("name", "") == JOB_DEF_SOURCE_ID:
			val = kv.get("value")
			if not val:
				continue
			source_id_to_job_def_name[val] = job_def.get("jobDefinitionName")
			break
rules = []

for source in sources:
	source_name = source.get("name")
	source_id = source.get("_id")
	source_rule = SOURCE_RULE.copy()
	job_def_name = source_id_to_job_def_name.get(source_id)
	if not job_def_name:
		print(f"No job definition found using source ID {source_id}")
		continue
	source_rule["rule_name"] = f"{job_def_name}"
	source_rule["target_name"] = job_def_name
	source_rule["source_name"] = source_name
	source_rule["job_name"] = job_def_name
	source_rule["description"] = f"Scheduled Batch ingestion rule for source: {source_name} with ID: {source_id} for environment: {env}"
	rules.append(source_rule)

print(f"Writing source information to {FILE_NAME}")

with open(FILE_NAME, "w") as f:
	json.dump(rules, f, indent=4)

print("Done")
