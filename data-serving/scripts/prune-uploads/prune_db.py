import os
import sys
import logging
import pymongo
import argparse
from time import time
from logger import setup_logger


def prune_db():
    # parse CLI arguments
    parser = argparse.ArgumentParser(
        description="Deletes cases marked list=False."
    )
    parser.add_argument("--live", help="Live action", action="store_true")
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

    # report attempted database query
    logging.info(f"Removal criteria is set to {criteria=}")
    logging.info(f"Database is set to {CONN}")
    logging.info(f"Flag is set to {args.live=}")

    # get removal statistics
    ts = time()
    count_total = db.cases.estimated_document_count()
    logging.info(f"Got case count: {count_total} ({(time()-ts):.3f} secs)")

    ts = time()
    count_listFalse = db.cases.count_documents(criteria)
    logging.info(f"Got removal count: {count_listFalse} ({(time()-ts):.3f} secs)")
    prc = 100 * count_listFalse / count_total

    # perform records removal
    if args.live:
        logging.info("(LIVE) Sending delete query...")
        logging.info(f"Removing {count_listFalse} of {count_total} records ({prc:.1f}%)")
        try:
            pass
            ts = time()
            response = db.cases.delete_many(criteria)
            logging.info("(LIVE) Query completed (acknowledged: "
                         f"{response.acknowledged}, "
                         f"deleted_count={response.deleted_count}) ({(time()-ts):.3f} secs)")
            ts = time()
            updated_count_total = db.cases.count_documents({})
            logging.info(f"(LIVE) Updated case count: {updated_count_total} ({(time()-ts):.3f} secs)")
        except pymongo.errors.PyMongoError as e:
            logging.info(f"(LIVE) Database ERROR: {e}")
    else:
        logging.info("(DRY-RUN) - No changes will be made")
        logging.info(f"Removing {count_listFalse} of {count_total} records ({prc:.1f}%)")
        logging.info("(DRY-RUN) - No changes made")


if __name__ == "__main__":
    setup_logger()
    logging.info("Starting database pruning...")
    prune_db()
    logging.info("Work complete")
