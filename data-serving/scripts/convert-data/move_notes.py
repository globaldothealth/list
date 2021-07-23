#!/usr/bin/env python
import argparse
import pprint
import pymongo


def database(connection_string, db_name):
    """Connect to mongodb."""
    client = pymongo.MongoClient(connection_string)
    return client[db_name]


def move_notes(db, collection, source_id, source, dest, dry_run):
    """Move the values in the 'source' key to the 'dest' key for cases in the 'collection'
    collection in the 'db' where their caseReference.sourceId matches 'source_id'.
    If 'dry_run' is set, then don't actually change anything, but do report on which cases
    would be modified."""
    query = { "caseReference.sourceId": source_id }
    if dry_run:
        cases = db[collection].find(query)
        print(f"Would move {source} to {dest} on:")
        for case in cases:
            pprint.pprint(case)
        return
    operations = [
        pymongo.UpdateMany(query, { "$rename": { source: dest } })
    ]
    outcome = db[collection].bulk_write(operations)
    pprint.pprint(outcome.bulk_api_result)


def main():
    parser = argparse.ArgumentParser(
        description='Move case notes between the regular and restricted notes fields.')
    parser.add_argument('--connection_string', type=str, required=True, help='mongodb connection string')
    parser.add_argument('--source_id', type=str, required=True, help='Source identifier for cases to update')
    parser.add_argument('--database_name', type=str, default='covid19', help='Name of the database with cases to update')
    parser.add_argument('--collection_name', type=str, default='cases', help='Collection with cases to update')
    parser.add_argument('--derestrict', action="store_true", help='Move restricted notes to notes (default is move notes to restricted notes)')
    parser.add_argument('--dry_run', action="store_true", help="Don't actually make any changes, just report on what would have changed")

    args = parser.parse_args()

    db = database(args.connection_string, args.database_name)

    [source, destination] = ["restrictedNotes", "notes"] if args.derestrict else ["notes", "restrictedNotes"]

    move_notes(db, args.collection_name, args.source_id, source, destination, args.dry_run)


if __name__ == '__main__':
    main()
