import json
import os
import sys
from datetime import datetime
import csv

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



def convert_date(raw_date):
    """
    Convert raw date field into a value interpretable by the dataserver.
    """
    date = datetime.strptime(raw_date, "%Y-%m-%d")
    return date.strftime("%m/%d/%YZ")


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """
    Parses G.h-format case data from raw API data.

    Some caveats:
        1. There are no patient ID/case ID in the raw API so we aren't able
           to dedupe.
        2. We can't link confirmed cases and confirmed deaths because of (1)
           so we're only importing confirmed cases and ignoring deaths.
    """
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            num_confirmed_cases = int(row["casos_novos"])
            if (not num_confirmed_cases) or (row["nome_munic"] == "Ignorado"):
                continue
            try:
                when = convert_date(row["datahora"])
                case = {
                    "caseReference": {"sourceId": source_id, "sourceUrl": source_url},
                    "location": {"query": f"{row['nome_munic']}, São Paulo, Brazil"},
                    "events": [
                        {
                            "name": "confirmed",
                            "dateRange": {
                                "start": when,
                                "end": when,
                            },
                        },
                    ],
                }
                for _ in range(num_confirmed_cases):
                    yield case
            except ValueError as ve:
                raise ValueError("Unhandled data: {}".format(ve))



def lambda_handler(event):
    return parsing_lib.run_lambda(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        lambda_handler(event)
