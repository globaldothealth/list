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

def parse_cases(raw_data_file, source_id, source_url):
    """
    Parses G.h-format case data from raw API data.
    """

    def parse_csv_line(line):
        """
        Parse one csv line within the csv file.
        """

        date_report = convert_date(line[7]) # date_report

        return {
            "caseReference": {
                "sourceId": source_id,
                "sourceEntryId": line[0], # case_id
                "sourceUrl": source_url,
                "additionalSources": additional_sources(line[12], line[14]) # case_source, additional_source
            },
            "location": convert_location(line[4], line[5], line[6]), # health_region, province, country
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
                "ageRange": convert_age(line[2]), # age
                "gender": line[3] if line[3] in ('Male', 'Female') else None, # sex
            },
            "notes": line[13] if len(line[13]) > 0 else None # additional_info
        } 

    with open(raw_data_file, "r") as f:
        reader = csv.reader(f)
        next(reader, None)  # skip the headers
        return [parse_csv_line(row) for row in reader]    

def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
