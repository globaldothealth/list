import os
import sys
from datetime import datetime
import csv
import json

# Layer code, like parsing_lib, is added to the path by AWS.
# To test locally (e.g. via pytest), we have to modify sys.path.
# pylint: disable=import-error
 
try:
    import parsing_lib
except ImportError:
    sys.path.append(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            os.pardir,os.pardir, 'common'))
    import parsing_lib


TAIWAN_LOCATION = {
    "country": "Taiwan",
    # Go to wikipedia to debate please, thank you.
    "geoResolution": "Country",
    "name": "Taiwan",
    "geometry": {
        "longitude": float("120.930229378541"),
        "latitude": float("23.7779779950014")
    }
}


def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.

    Date filtering API expects mm/dd/YYYYZ format.
    """
    date = datetime.strptime(raw_date, "%Y/%m/%d")
    return date.strftime("%m/%d/%YZ")


def convert_gender(raw_gender: str):
    if raw_gender == "男":
        return "Male"
    elif raw_gender == "女":
        return "Female"
    else:
        raise ValueError(f'Unhandled gender: {raw_gender}')


def convert_demographics(gender: str, age: str):
    demo = {}
    if gender:
        demo["gender"] = convert_gender(gender)
    if age:
        # Brackets are like "35-39" or "over 85".
        if '-' in age:
            start, _, end = age.partition("-")
            demo["ageRange"] = {
                "start": float(start),
                "end": float(end),
            }
        elif age.isdigit():
            demo["ageRange"] = {
                "start": float(age),
                "end": float(age),
            }
        elif age == "70+":
            demo["ageRange"] = {
                "start": 70.0,
                "end": 120.0,
            }
        else:
            raise ValueError(f'Unhandled age: {age}')
    return demo or None


def convert_immigration(immigration_status: str):
    return ({"traveledPrior30Days": True} if immigration_status == "是"
        else None)


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Parses G.h-format case data from raw API data.
    Remarks: No per-case ID is available so we can't dedupe cases.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceUrl": source_url,
                },
                "location": (
                    # 空值 means "empty value", it's not a city.
                    {"query": f"{row['縣市']}, Taiwan"} if row['縣市'] != '空值'
                    else TAIWAN_LOCATION),
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": convert_date(row['個案研判日']),
                            "end": convert_date(row['個案研判日']),
                        },
                    },
                ],
                "demographics": convert_demographics(
                    # Sex.
                    row['性別'],
                    # Age range.
                    row['年齡層']),
                "travelHistory": convert_immigration(row["是否為境外移入"]),
            }
            # Number of cases that this row represents.
            for _ in range(int(row["確定病例數"])):
                yield case


def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)