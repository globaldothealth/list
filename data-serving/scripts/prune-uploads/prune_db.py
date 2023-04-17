import os
import sys
import logging
import pymongo
from bson.objectid import ObjectId
import argparse
from time import time
from logger import setup_logger


def prune_db():
    # parse CLI arguments
    parser = argparse.ArgumentParser(
        description="Deletes cases marked list=False."
    )
    parser.add_argument(
        "--live",
        help="Live action",
        action="store_true"
    )
    parser.add_argument(
        "--get_removal_count",
        help="Estimate removal count (can be very slow)",
        action="store_true",
    )
    parser.add_argument(
        "--get_source_ids",
        help="Query server for source ids (checks 'sources' collections)",
        action="store_true",
    )
    parser.add_argument(
        "--get_source_ids_with_upload_counts",
        help="Query server for source ids and also return upload counts",
        action="store_true",
    )
    parser.add_argument(
        "--get_orphaned_source_ids",
        help="Returns unique SourceIds from Cases (uses list=False)",
        action="store_true",
    )
    parser.add_argument(
        "--get_upload_ids",
        help="Query server for upload ids",
        action="store_true",
    )
    parser.add_argument(
        "--sourceid",
        help="SourceId for selective removal",
        default=None,
        type=str
    )
    args = parser.parse_args()

    # make database connection
    try:
        if (CONN := os.environ.get("CONN")) is None:
            logging.error("Specify MongoDB connection_string in CONN")
            sys.exit(1)
        client = pymongo.MongoClient(CONN)
        db = client[os.environ.get("DB", "covid19")]
        logging.info("Database connection ok")
    except pymongo.errors.ConnectionFailure:
        logging.error("Database connection fail")
        sys.exit(1)

    # removal criteria
    criteria = {"$or": [{"list": False}, {"list": {"$exists": False}}]}
    sourceid = args.sourceid
    if sourceid:
        criteria = {"$and": [{"caseReference.sourceId": sourceid}, criteria]}

    # report attempted database query
    logging.info(f"Removal criteria is set to {criteria=}")
    logging.info(f"Database is set to {CONN}")
    logging.info(f"Flags are set to {args=}")

    # get removal statistics
    ts = time()
    count_total = db.cases.estimated_document_count()
    logging.info(f"Got case count: {count_total} ({(time()-ts):.3f} secs)")

    # get number of documents to remove (warning: whole collection query - likely to be very slow!)
    if args.get_removal_count:
        ts = time()
        count_listFalse = db.cases.count_documents(criteria)
        logging.info(f"Got removal count: {count_listFalse} ({(time()-ts):.3f} secs)")
    else:
        logging.warning(
            "Skipping removal count estimation (can be very slow); "
            "total records to be removed unknown."
        )

    # return a list of unique source IDs from the server
    if args.get_source_ids:
        ts = time()
        if sourceid:
            logging.error("Cannot specify a sourceid to get SourceIds")
            sys.exit(1)
        try:
            response = db.sources.find()
        except pymongo.errors.PyMongoError as e:
            logging.error(f"Error getting upload IDs: {e}")
            sys.exit(1)
        items = [str(item["_id"]) for item in response]
        logging.info(f"Source IDs (n={len(items)}): {items}")
        logging.info(f"Query time ({(time()-ts):.3f} secs)")
        return

    # query all unique SourceIds from the 'cases' collection
    if args.get_orphaned_source_ids:
        ts = time()
        if sourceid:
            logging.error("Cannot specify a sourceid to get SourceIds")
            sys.exit(1)
        try:
            response = db.cases.distinct("caseReference.sourceId", criteria)
        except pymongo.errors.PyMongoError as e:
            logging.error(f"Error getting upload IDs: {e}")
            sys.exit(1)
        items = [str(item) for item in response]
        logging.info(f"Source IDs (n={len(items)}): {items}")
        logging.info(f"Query time ({(time()-ts):.3f} secs)")
        return

    # return a list of unique source IDs from the server, with upload counts
    if args.get_source_ids_with_upload_counts:
        ts = time()
        if sourceid:
            logging.error("Cannot specify a sourceid to get SourceIds")
            sys.exit(1)
        try:
            response = db.sources.find()
        except pymongo.errors.PyMongoError as e:
            logging.error(f"Error getting upload IDs: {e}")
            sys.exit(1)
        items = [(str(item["_id"]),
                  db.sources.find({"_id": item["_id"]})[0]["name"],
                  len(db.sources.find({"_id": item["_id"]})[0]["uploads"]))
                 for item in response]
        logging.info(f"Source IDs (n={len(items)}): {items}")
        logging.info(f"Query time ({(time()-ts):.3f} secs)")
        return

    # return a list of unique upload IDs (can be filtered by sourceId)
    if args.get_upload_ids:
        ts = time()
        if not sourceid:
            logging.error("Must specify a sourceid to get UploadIds")
            sys.exit(1)
        try:
            response = db.sources.find({"_id": ObjectId(sourceid)})
        except pymongo.errors.PyMongoError as e:
            logging.error(f"Error getting upload IDs: {e}")
            sys.exit(1)
        items = [str(item["_id"]) for item in response]
        logging.info(f"Upload IDs (n={len(items)}): {items}")
        logging.info(f"Query time ({(time()-ts):.3f} secs)")
        return

    # perform records removal
    try:
        ts = time()
        if args.live:
            logging.info("(LIVE) Sending delete query...")
            try:
                response = db.cases.bulk_write([pymongo.DeleteMany(criteria)])
            except pymongo.errors.BulkWriteError as bwe:
                logging.addLevelNamerror("Error during Bulk delete operation:")
                logging.error(bwe)
            else:
                logging.info("(LIVE) Result of Bulk delete operation:")
                logging.info(response.bulk_api_result)
        else:
            logging.info("(DRY-RUN) - No changes will be made")
        updated_count_total = db.cases.estimated_document_count()
        logging.info(
            f"Updated case count: {updated_count_total} ({(time()-ts):.3f} secs)"
        )
    except pymongo.errors.PyMongoError as e:
        logging.info(f"Database ERROR: {e}")
    if not args.live:
        logging.info("(DRY-RUN) - No changes made")


if __name__ == "__main__":
    setup_logger()
    logging.info("Starting database pruning...")
    prune_db()
    logging.info("Work complete.")
