"""
Manual migration script for age bucket transition

This script deploys the data transition from
demographics.ageRange.{start,end} to demographics.ageBuckets. The age
buckets are defined in an ageBuckets collection in the DB that is created
using an automatic migration. While this defines the age buckets, it does
not alter the currently existing information in the database which still
uses ageRange. To manually transition the data, this reads in each case and
uses the ageBuckets collection to figure out the buckets and write them to
the database.
"""

import os
import logging
from typing import Hashable

import pymongo
from tqdm import tqdm

DEFAULT_DB = "covid19"


def find_age_buckets(
    start: int, end: int, age_buckets: dict[Hashable, tuple[int, int]]
) -> list[Hashable]:
    return [
        bucket
        for (bucket, (bstart, bend)) in age_buckets.items()
        if (bstart <= start <= bend)
        or (bstart <= end <= bend)
        or (bstart > start and bend < end)
    ]


def migrate_age_buckets(db, collection: str = "cases"):
    age_buckets = {
        record["_id"]: (record["start"], record["end"])
        for record in db.ageBuckets.find()
    }
    assert age_buckets
    for case in tqdm(
        db[collection].find({"list": True, "demographics.ageRange": {"$exists": True}})
    ):
        db[collection].find_one_and_update(
            {"_id": case["_id"]},
            {
                "$set": {
                    "demographics.ageBuckets": find_age_buckets(
                        int(case["demographics"]["ageRange"]["start"]),
                        int(case["demographics"]["ageRange"]["end"]),
                        age_buckets,
                    )
                },
                "$unset": {"demographics.ageRange": ""},
            },
        )


if __name__ == "__main__":
    try:
        if (CONN := os.getenv("CONN")):
            client = pymongo.MongoClient(CONN)
        else:
            client = pymongo.MongoClient()
    except Exception as e:
        logging.error(e)
        raise

    db = client[os.getenv("DB_NAME", DEFAULT_DB)]
    migrate_age_buckets(db)
