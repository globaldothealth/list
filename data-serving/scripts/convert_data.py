# Lint as: python3
'''Script to convert CSV line-list data into json compliant with the MongoDB schema.'''

import argparse
import csv
import logging
import json
import pandas as pd
from pandas import DataFrame
from typing import List


def main():
    logging.basicConfig(filename='convert_data.log',
                        filemode='w', level=logging.DEBUG)

    parser = argparse.ArgumentParser(
        description='Convert CSV line-list data into json compliant with the MongoDB schema.')
    parser.add_argument('--csv_path', required=True)
    parser.add_argument('--json_path', default='cases.json')
    args = parser.parse_args()
    logging.info("Args: %s", args)

    print('Reading data from', args.csv_path)
    original_cases = read_csv(args.csv_path)

    print('Converting data to new schema')
    converted_cases = convert(original_cases)

    print('Writing results to', args.json_path)
    write_json(converted_cases, args.json_path)

    print('Great success! 🎉')


def read_csv(csv_path: str) -> DataFrame:
    return pd.read_csv(csv_path, header=0, low_memory=False)


def convert(original_cases: DataFrame) -> DataFrame:
    logging.info('Converting %d cases', len(original_cases))
    # TODO: Much, much more conversion.
    return original_cases.rename(columns={"ID": "_id"})


def write_json(cases: DataFrame, json_path: str) -> None:
    cases.to_json(json_path, orient='records', indent=2)


if __name__ == '__main__':
    main()
