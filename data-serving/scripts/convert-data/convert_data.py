'''
Script to convert CSV line-list data into json compliant with the MongoDB
schema.
'''

import argparse
import csv
from datetime import datetime
import logging
from importlib import machinery
import itertools
import json
import progressbar
from converters import (
    convert_demographics, convert_dictionary_field, convert_events,
    convert_imported_case, convert_location,
    convert_notes_field, convert_case_reference_field, convert_travel_history)
from typing import Any
from constants import (
    DATA_CSV_FILENAME, DATA_GZIP_FILENAME, DATA_REPO_PATH, GEOCODER_DB_FILENAME,
    GEOCODER_MODULE, GEOCODER_REPO_PATH, LOSSY_FIELDS)
from utils import format_iso_8601_date
import tarfile
import os


def main():
    logging.basicConfig(filename='conversion_errors.tsv',
                        filemode='w', level=logging.ERROR,
                        format='%(message)s')

    parser = argparse.ArgumentParser(
        description='Convert CSV line-list data into json compliant with the '
        'MongoDB schema.')
    parser.add_argument('--ncov2019_path', type=str, required=True)
    parser.add_argument('--outfile', type=str, required=True)
    parser.add_argument('--sample_rate', default=1.0, type=float)

    args = parser.parse_args()

    csv_path = extract_csv(args.ncov2019_path)
    num_cases = len(open(csv_path).readlines())
    num_to_convert = int(args.sample_rate*num_cases)
    print(f'Converting {num_to_convert} / {num_cases} cases from {csv_path}')

    print('Converting data to new schema and writing to', args.outfile)
    convert(csv_path, args.outfile, load_geocoder(
        args.ncov2019_path), args.sample_rate, num_to_convert)

    # Clean up the CSV file we unzipped.
    os.remove(csv_path)

    print('Great success! 🎉')


def load_geocoder(repo_path: str) -> Any:
    geocoder_path = os.path.join(repo_path, GEOCODER_REPO_PATH)
    geocodes_path = os.path.join(geocoder_path, GEOCODER_DB_FILENAME)
    spec = machinery.PathFinder().find_spec(GEOCODER_MODULE, [geocoder_path])
    geocoder_module = spec.loader.load_module()
    return geocoder_module.CSVGeocoder(geocodes_path, lambda x: None)


def extract_csv(repo_path: str) -> str:
    gzip_path = os.path.join(
        repo_path, DATA_REPO_PATH,
        DATA_GZIP_FILENAME)
    print('Unzipping', gzip_path)
    latest_data_gzip = tarfile.open(gzip_path)
    latest_data_gzip.extract(DATA_CSV_FILENAME)
    latest_data_gzip.close()

    return DATA_CSV_FILENAME


def convert(infile: str, outfile: str, geocoder: Any,
            sample_rate: int, num_to_convert: int) -> None:
    conversion_interval = int(1/sample_rate)
    bar = progressbar.ProgressBar(
        maxval=num_to_convert,
        widgets=[progressbar.Bar('=', '[', ']'),
                 ' ', progressbar.Percentage()])
    bar.start()

    with open(outfile, mode='w') as f:
        f.write('[')
        with open(infile, newline='') as csvfile:
            csvreader = csv.DictReader(csvfile)
            for i, csv_case in enumerate(itertools.islice(
                    csvreader, None, None, conversion_interval)):
                bar.update(i)
                if i != 0:
                    f.write(',')

                json_case = {}

                json_case['demographics'] = convert_demographics(
                    csv_case['ID'], csv_case['age'], csv_case['sex'])

                json_case['location'] = convert_location(
                    csv_case['ID'],
                    csv_case['location'],
                    csv_case['admin3'],
                    csv_case['admin2'],
                    csv_case['admin1'],
                    csv_case['country_new'],
                    csv_case['geo_resolution'],
                    csv_case['latitude'],
                    csv_case['longitude'])

                json_case['events'] = convert_events(csv_case['ID'], [
                    (
                        csv_case['date_onset_symptoms'],
                        None,
                        'date_onset_symptoms',
                        'onsetSymptoms'
                    ),
                    (
                        csv_case['date_admission_hospital'],
                        None,
                        'date_admission_hospital',
                        'hospitalAdmission'
                    ),
                    (
                        csv_case['date_confirmation'],
                        None,
                        'date_confirmation',
                        'confirmed'
                    ),
                    (
                        csv_case['date_death_or_discharge'],
                        csv_case['outcome'],
                        'date_death_or_discharge',
                        'outcome'
                    )
                ])

                json_case['symptoms'] = convert_dictionary_field(
                    csv_case['ID'],
                    'symptoms',
                    csv_case['symptoms'])

                json_case['preexistingConditions'] = convert_dictionary_field(
                    csv_case['ID'],
                    'preexistingConditions',
                    csv_case['chronic_disease'])

                json_case['revisionMetadata'] = {
                    'revisionNumber': 0,
                    # Using the googlegroups alias that contained all curators as we need
                    # a valid email in the curator field and we can't deduce it from just
                    # the initials that are present in the CSV.
                    'creationMetadata': {
                        'curator': 'covid19_spreadsheets@googlegroups.com',
                        'date': {
                            "$date": format_iso_8601_date(datetime.today()),
                        },
                    },
                }

                json_case['notes'] = convert_notes_field(
                    [csv_case['notes_for_discussion'],
                     csv_case['additional_information']])

                json_case['caseReference'] = convert_case_reference_field(
                    csv_case['ID'], csv_case['source'])

                json_case['travelHistory'] = convert_travel_history(
                    geocoder, csv_case['ID'],
                    csv_case['travel_history_dates'],
                    csv_case['travel_history_location'])

                # Archive the original fields.
                json_case['importedCase'] = convert_imported_case(
                    {k: csv_case[k] for k in LOSSY_FIELDS})

                f.write(
                    json.dumps(
                        {k: v for k, v in json_case.items() if v},
                        indent=2))

        # Close the json array.
        bar.finish()
        f.write(']')


if __name__ == '__main__':
    main()
