# prune_uploads.py -- Mark new uploads as ingested and delete failed uploads

# This is a script that should be run periodically that sets every upload
# older than the last successful upload to list = false (for non-UUID
# sources). For UUID sources, set everything to list = true. After marking,
# this deletes everything with list = false.

import os
import sys
from typing import Optional, List, Tuple, Dict, Any

import pymongo


def _ids(xs):
    return [str(x["_id"]) for x in xs]


def find_successful_upload(
    source: Dict[str, Any],
) -> Optional[Tuple[str, List[str]]]:
    # mark uploads is only for sources without stable identifiers
    hasStableIdentifiers = source.get("hasStableIdentifiers", False)
    if hasStableIdentifiers:
        return None
    uploads = source["uploads"]
    # sort uploads, with most recent being the first
    uploads.sort(key=lambda x: x["created"], reverse=True)
    # find first successful upload
    upload_statuses = [u["status"] for u in uploads]
    try:
        success_upload_idx = upload_statuses.index("SUCCESS")
    except ValueError:
        # no uploads were successful
        success_upload_idx = -1
    if success_upload_idx > -1:
        # Return uploads older than last successful upload
        return str(uploads[success_upload_idx]["_id"]), _ids(
            uploads[success_upload_idx + 1 :]
        )


def mark_uploads(
    cases: pymongo.collection.Collection, source_id: str, success: str, older: List[str]
):
    cases.update_many(
        {
            "caseReference.sourceId": source_id,
            "caseReference.uploadIds": {"$in": older},
        },
        {"$set": {"list": False}},
    )
    cases.update_many(
        {"caseReference.sourceId": source_id, "caseReference.uploadIds": [success]},
        {"$set": {"list": True}},
    )


def mark_all(cases: pymongo.collection.Collection, source_id):
    db.cases.update_many(
        {"caseReference.sourceId": source_id}, {"$set": {"list": True}}
    )


if __name__ == "__main__":

    # CONN is https://docs.mongodb.com/manual/reference/connection-string/
    try:
        print("Connecting to database...")
        client = pymongo.MongoClient(os.environ.get("CONN"))
        db = client.covid19
    except pymongo.errors.ConnectionFailure:
        print("Connection to database failed, aborting")
        sys.exit(1)

    errors = []

    for s in db.sources.find():
        _id = str(s["_id"])
        _n = s["name"]
        print(f"Processing source {_id}: {_n}")
        if not s.get("hasStableIdentifiers", False):
            if (m := find_successful_upload(s)) is None:
                print(f"[{_n}] No successful upload found")
                continue
            success, older = m
            delete = True
            try:
                print(f"[{_n}] Marking upload {success} to be in list for UUID source")
                mark_uploads(db.cases, _id, success, older)
            except pymongo.errors.PyMongoError:
                print(f"[{_n}] Error occurred, not deleting cases")
                delete = False  # Do not delete on error
                errors.append((_id, _n))
            if delete:
                try:
                    db.cases.delete_many({"caseReference.sourceId": _id, "list": False})
                    print(f"[{_n}] Deleted cases")
                except pymongo.errors.PyMongoError:
                    errors.append((_id, _n))
        else:
            try:
                print(f"[{_n}] Marking all cases to be in list for UUID source")
                mark_all(db.cases, _id)
            except pymongo.errors.PyMongoError:
                print(f"[{_n}] Marking cases failed")
                errors.append((_id, _n))
    if errors:
        print("Errors occurred while processing these sources:")
        for i, n in errors:
            print(i, n)
        sys.exit(1)
