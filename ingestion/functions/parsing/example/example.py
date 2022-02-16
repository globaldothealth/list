import os
import sys
import csv
import json

import common.parsing_lib as parsing_lib


def parse_cases(raw_data_file: str, source_id: str, source_url: str):
    """Example parsing code for a CSV source."""
    with open(raw_data_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            case = {
                "caseReference": {
                    "sourceId": source_id,
                    "sourceUrl": source_url,
                },
                "location": {
                    "query": "Some district, Some country"
                },
                "events": [
                    {
                        "name": "confirmed",
                        "dateRange":
                        {
                            "start": "03/06/2020Z",
                            "end": "03/06/2020Z",
                        },
                    },
                ],
            }
            yield case


def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
