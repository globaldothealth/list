import os
import sys
import csv

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


def lambda_handler(event, context):
    return parsing_lib.run_lambda(event, context, parse_cases)
