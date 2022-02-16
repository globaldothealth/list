import json
import os
import sys
from datetime import datetime
import csv

import common.parsing_lib as parsing_lib


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



def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
