import csv
import os
import sys
import re
from datetime import date, datetime

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
try:
    import parsing_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'common/python'))
    import parsing_lib

# Input format: '60-69' -> {"start": 60, "end": 69}
def convert_age(raw_age):
    segments = raw_age.split("-")
    if len(segments) != 2:
        return None
    return { "start": int(segments[0]) , "end": int(segments[1]) }

def convert_location(health_region, province, country):
    terms = []
    if country == "Not Reported":
        raise ValueError("Country is not reported")
    if health_region != "Not Reported":
        terms.append(health_region)
    if province != "Not Reported":
        terms.append(province)
    terms.append(country)
    return {"query":  ", ".join(terms)}

# dd-mm-yyyy -> %m/%d/%Y
def convert_date(raw):
    return datetime.strftime(datetime.strptime(raw, "%d-%m-%Y"), "%m/%d/%Y")

def additional_sources(case_source, additional_source):
    def parse(source):
        if len(source) == 0:
            return None
        segments = source.split(";")
        # The url might be (1) https://abc.def or [1] https://abc.def.
        rtn = []
        for segment in segments:
            rst = re.findall(r"(http.*)", segment)
            if len(rst) != 0:
                rtn.append(rst[0].strip())
        return rtn
    return parse(case_source) + parse(additional_source)

def convert_travel(s):
    if len(s) == 0:
        return {"travelledPrior30Days": False}
    travel = [{"location": {"query": country.strip()}} for country in s.split(",")]
    if len(travel) == 0:
        return {"travelledPrior30Days": False}
    else:
        return {"travelledPrior30Days": True, "travel": travel}

def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.
    """

    def parse_csv_line(row):
        """
        Parse one csv line within the csv file.
        """

        date_report = convert_date(row["date_report"])

        return {
            "caseReference": {
                "sourceId": source_id,
                "sourceEntryId": row["case_id"],
                "sourceUrl": source_url,
                "additionalSources": additional_sources(row["case_source"], row["additional_source"])
            },
            "location": convert_location(row["health_region"], row["province"], row["country"]),
            "travelHistory": convert_travel(row["travel_history_country"]),
            "events": [
                {
                    "name": "confirmed",
                    "dateRange":
                    {
                        "start": date_report,
                        "end": date_report
                    }
                }
            ],
            "demographics": {
                "ageRange": convert_age(row["age"]),
                "gender": row["sex"] if row["sex"] in ('Male', 'Female') else None,
            },
            "notes": row["additional_info"] if len(row["additional_info"]) > 0 else None
        }

    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        return [parse_csv_line(row) for row in reader]

def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
