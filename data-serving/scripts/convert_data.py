# Lint as: python3
'''Script to convert CSV line-list data into json compliant with the MongodB schema.'''

import argparse
import csv
import logging
import json

parser = argparse.ArgumentParser(
    description='Convert CSV line-list data into json compliant with the MongodB schema.')
parser.add_argument('--csv_path', required=True)
parser.add_argument('--json_path', default='cases.json')


def main():
    logging.basicConfig(filename='convert_data.log', level=logging.INFO)
    args = parser.parse_args()
    logging.info("Args: %s", args)

    print('Reading data from', args.csv_path)
    cases = read_csv(args.csv_path)

    print('Converting data to new schema')
    convert(cases)

    print('Writing results to', args.json_path)
    write_json(cases, args.json_path)

    print('Great success! 🎉')


def read_csv(csv_path):
    cases = []
    with open(csv_path, newline='') as csvfile:
        csvreader = csv.DictReader(csvfile)
        logging.debug('fields: %s', csvreader.fieldnames)
        for record in csvreader:
            cases.append(record)
    return cases


def convert(cases):
    logging.info('Converting %d cases', len(cases))
    for case in cases:
        case['_id'] = case.pop('ID')
    # TODO: Much, much more conversion.


def write_json(cases, json_path):
    with open(json_path, 'w') as outfile:
        json.dump(cases, outfile, sort_keys=True, indent=2)


if __name__ == '__main__':
    main()
