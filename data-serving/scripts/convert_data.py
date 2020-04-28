'''Script to convert CSV line-list data into json compliant with the MongoDB schema.'''

import argparse
import csv
import datetime
import logging
import math
import numbers
import json
import pandas as pd
import sys
from pandas import DataFrame
from typing import List


def main():
    logging.basicConfig(filename='convert_data.log',
                        filemode='w', level=logging.DEBUG)

    parser = argparse.ArgumentParser(
        description='Convert CSV line-list data into json compliant with the MongoDB schema.')
    parser.add_argument('--infile', type=argparse.FileType('r'))
    parser.add_argument('--outfile', nargs='?', type=argparse.FileType('w', encoding='UTF-8'),
                        default=sys.stdout)
    parser.add_argument('--sample_rate', default=1.0, type=float)

    args = parser.parse_args()
    logging.info("Args: %s", args)

    print('Reading data from', args.infile.name)
    original_cases = read_csv(args.infile)

    if args.sample_rate < 1.0:
        original_size = original_cases.size
        original_cases = original_cases.sample(frac=args.sample_rate)
        print(
            f'Downsampling to {args.sample_rate} cases from {original_size} to {original_cases.size} rows')

    print('Converting data to new schema')
    converted_cases = convert(original_cases)

    print('Writing results to', args.outfile.name)
    write_json(converted_cases, args.outfile)

    print('Great success! 🎉')


def read_csv(infile: str) -> DataFrame:
    return pd.read_csv(infile, header=0, low_memory=False, encoding='utf-8')


def convert(cases: DataFrame) -> DataFrame:
    logging.info('Converting %d cases', len(cases))

    # [[_id]]
    cases = cases.rename(columns={'ID': '_id'})

    # [[demographics]]
    validSexes = ['female', 'male']

    def generateDemographics(id, age, sex: str):
        demographics = {}

        try:
            ageFloat = float(age)
            # Without the below, it prints null in the JSON
            if not math.isnan(ageFloat):
                demographics['age'] = {
                    'years': ageFloat
                }
        except ValueError:
            logging.warning('[%s] [demographics.age] value error %s', id, age)

        if str(sex).lower() in validSexes:
            demographics['sex'] = str(sex).capitalize()

        return demographics

    cases['demographics'] = cases.apply(
        lambda x: generateDemographics(x['_id'], x['age'], x['sex']), axis=1)

    # [[events]]
    def generateEvents(id, dates, outcome):
        events = []

        for key in dates:
            try:
                date = datetime.datetime.strptime(
                    dates[key], '%d.%m.%Y').date()
                events.append({
                    'name': key,
                    'date': {
                        '$date': date.strftime('%Y-%m-%dT%H:%M:%SZ')
                    }
                })
            except (TypeError, ValueError):
                logging.warning(
                    '[%s] [eventSequence.%s] value error %s', id, key, dates[key])

        if outcome and type(outcome) is str:
            events.append({'name': outcome})

        return events

    cases['events'] = cases.apply(
        lambda x: generateEvents(x['_id'], {
            'onsetSymptoms': x['date_onset_symptoms'],
            'admissionHospital': x['date_admission_hospital'],
            'confirmed': x['date_confirmation'],
            'deathOrDischarge': x['date_death_or_discharge']
        }, x['outcome']), axis=1)

    # Filter out deprecated columns
    cases = cases.filter(
        items=['demographics', 'events'])

    return cases


def write_json(cases: DataFrame, outfile: str) -> None:
    json.dump([row.dropna().to_dict()
               for index, row in cases.iterrows()], outfile, indent=2)


if __name__ == '__main__':
    main()
