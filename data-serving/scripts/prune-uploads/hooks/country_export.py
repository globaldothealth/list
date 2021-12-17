# Exports country specific data by submitting
# corresponding exporter_* job definitions

from functools import cache
import logging
import re
from typing import Any
import unicodedata

import boto3
import pycountry


# We do not always use the pycountry names, here's a list of exceptions
_QUIRKS = {
    "CD": "Democratic Republic of the Congo",
    "CG": "Republic of Congo",
    "CZ": "Czech Republic",
    "IR": "Iran",
    "KR": "South Korea",
    "RU": "Russia",
}


def to_ascii(s: str) -> str:  # We use ASCII only for country names :(
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()


def slug(s: str) -> str:
    return re.sub(r"[,.']", "", s.strip().lower()).replace(" ", "_")


def country_name(country) -> str:
    "Gets common name of country if available, otherwise name"
    if hasattr(country, "common_name"):
        return getattr(country, "common_name")
    else:
        return getattr(country, "name")


_CODE_NAME_MAP = {c.alpha_2: to_ascii(country_name(c)) for c in pycountry.countries}
_CODE_NAME_MAP.update(_QUIRKS)


@cache
def list_exporters(env: str) -> set[str]:
    "Returns all job definitions starting with env-exporter_"
    batch = boto3.client("batch")
    return {
        j["jobDefinitionName"]
        for j in batch.describe_job_definitions()["jobDefinitions"]
        if j["jobDefinitionName"].startswith(f"{env}-exporter_")
    }


def get_exporters(source: dict[str, Any], env: str) -> set[str]:
    "Gets possible exporter job definition names from source"
    name = source["name"]
    countryCodes = set(source.get("countryCodes", []))
    if "ZZ" in countryCodes:  # all countries
        return list_exporters()
    validCountryCodes = set(_CODE_NAME_MAP)
    if invalidCountryCodes := countryCodes - validCountryCodes:
        logging.info(f"Invalid country codes {invalidCountryCodes}")
        return set()
    if countryCodes:  # prefer country codes to names
        return {
            f"{env}-exporter_{slug(_CODE_NAME_MAP[cc])}"
            for cc in countryCodes & validCountryCodes
        }
    else:  # works if country:source is 1:1 and name matches
        return {f"{env}-exporter_{slug(name)}"}


def run(sources: list[dict[str, Any]], env: str, dry_run: bool = False):
    logging.info("*** Running hook: country_export ***")
    batch = boto3.client("batch")
    if not sources:
        logging.info("No sources to run hook for, quitting.")
        return
    jobdefs = set.union(*(get_exporters(s, env) for s in sources))
    all_exporters = list_exporters(env)
    if unknown_exporters := jobdefs - all_exporters:
        logging.warning(f"Ignoring unknown exporters {unknown_exporters}")
    for jobdef in jobdefs & all_exporters:
        try:
            logging.info(f"Submitting job for {jobdef} ...")
            if not dry_run:
                batch.submit_job(
                    jobName=jobdef, jobDefinition=jobdef, jobQueue="export-queue"
                )
        except Exception as e:
            logging.exception(f"Error occurred while trying to submit {jobdef}")
