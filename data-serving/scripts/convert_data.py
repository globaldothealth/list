# Lint as: python3
'''Script to convert CSV line-list data into json compliant with the MongoDB schema.'''

import argparse
import csv
import logging
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
    args = parser.parse_args()
    logging.info("Args: %s", args)

    print('Reading data from', args.infile)
    original_cases = read_csv(args.infile)

    print('Converting data to new schema')
    converted_cases = convert(original_cases)

    print('Writing results to', args.outfile)
    write_json(converted_cases, args.outfile)

    print('Great success! 🎉')


def read_csv(infile: str) -> DataFrame:
    return pd.read_csv(infile, header=0, low_memory=False, encoding='utf-8')


def convert(original_cases: DataFrame) -> DataFrame:
    logging.info('Converting %d cases', len(original_cases))
    # TODO: Much, much more conversion.
    return original_cases.rename(columns={"ID": "_id"})


def write_json(cases: DataFrame, outfile: str) -> None:
    cases.to_json(outfile, orient='records', indent=2)


if __name__ == '__main__':
    main()
