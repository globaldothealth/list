# prune_uploads.py -- Mark new uploads as ingested and delete failed uploads

# This is a script that should be run periodically that sets every upload
# older than the last acceptable upload to list = false (for non-UUID
# sources). For UUID sources, set everything to list = true. After marking,
# this deletes everything with list = false.

import os
import re
import sys
import argparse
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime

import pymongo
from bson.objectid import ObjectId


def msg(m, string):
    "Prints string and appends to m"
    print(string)
    m.append(string)


def _ids(xs):
    return [str(x["_id"]) for x in xs]


def accept_reject_msg(accept, reject, success=True):
    m = []
    ok = "ok" if success else "fail"
    if accept:
        m.extend([f"accept {a} {ok}" for a in accept])
    if reject:
        m.extend([f"reject {r} {ok}" for r in reject])
    return m


def is_acceptable(upload: Dict[str, Any], threshold: float) -> bool:
    """Whether an upload is acceptable

    :param upload: Upload data as a dictionary
    :param threshold: Threshold ratio of errors above which an upload
    is not accepted

    :return: Whether the upload is acceptable
    """
    created = upload['summary'].get('numCreated', 0)
    updated = upload['summary'].get('numUpdated', 0)
    errors = upload['summary'].get('numError', 0)
    return (
        upload['status'] == "SUCCESS"
        and created > 0
        and updated == 0  # non-UUID sources should never update a case
        and errors / (errors + created) <= threshold
    )


def find_acceptable_upload(
    source: Dict[str, Any], threshold: float, epoch: datetime = None
) -> Optional[Tuple[str, List[str]]]:
    """Finds uploads that can be accepted for inclusion in line list

    :param source: Source data
    :param threshold: Threshold ratio of errors above which
      an upload is not accepted.
    :param epoch: Epoch date after which acceptable uploads will be considered

    epoch is the initial datetime after which we should consider non-UUID
    sources to have data only corresponding to a single upload. Prior to
    this date, data does not correspond to a single upload.

    If not specified, considers the last acceptable upload to be
    contain the entire dataset.

    :return: A tuple of
      (last acceptable upload, list of uploads to mark for deletion).
      If no acceptable upload is found, returns None
    """
    uploads = source.get("uploads", [])
    # skip accepted or rejected uploads
    uploads = [u for u in uploads if "accepted" not in u]
    if not uploads:
        return None

    if source.get("hasStableIdentifiers", False):
        return _ids(u for u in uploads if u['status'] != "IN_PROGRESS"), []

    # sort uploads, with most recent being the first
    uploads.sort(key=lambda x: x["created"], reverse=True)
    accept_uploads = [is_acceptable(u, threshold) for u in uploads]
    try:
        accept_idx = accept_uploads.index(True)
    except ValueError:
        accept_idx = -1  # no acceptable upload found
    if accept_idx > -1 and (not epoch or uploads[accept_idx]["created"] > epoch):
        # Return uploads older than last successful upload
        return [str(uploads[accept_idx]["_id"])], _ids(
            uploads[accept_idx + 1 :]
            # Also mark for deletion uploads after accepted upload
            # that are not IN_PROGRESS
            + [u for u in uploads[:accept_idx] if u["status"] != "IN_PROGRESS"]
        )


def mark_cases_non_uuid(
    cases: pymongo.collection.Collection,
    sources: pymongo.collection.Collection,
    source_id: str,
    accept: List[str],
    reject: List[str],
):
    assert len(accept) == 1
    if reject:
        cases.update_many(
            {
                "caseReference.sourceId": source_id,
                "caseReference.uploadIds": {"$in": reject},
            },
            {"$set": {"list": False}},
        )
    cases.update_many(
        {"caseReference.sourceId": source_id, "caseReference.uploadIds": accept},
        {"$set": {"list": True}},
    )
    mark_upload(sources, source_id, accept, accept=True)
    if reject:
        mark_upload(sources, source_id, reject, accept=False)


def mark_upload(
    sources: pymongo.collection.Collection,
    source_id: str,
    upload_ids: List[str],
    accept: bool,
):
    "Marks upload acceptance status in the sources collection"
    upload_ids = [ObjectId(u) for u in upload_ids]
    sources.update_one(
        {"_id": ObjectId(source_id)},
        {"$set": {"uploads.$[u].accepted": accept}},
        array_filters=[{"u._id": {"$in": upload_ids}}],
    )


def mark_cases_uuid(
    cases: pymongo.collection.Collection,
    sources: pymongo.collection.Collection,
    source_id,
    accept: List[str],
):
    "Marks cases for UUID sources"
    cases.update_many(
        {
            "caseReference.sourceId": source_id,
            "caseReference.uploadIds": {"$in": accept},
        },
        {"$set": {"list": True}},
    )
    mark_upload(sources, source_id, accept, accept=True)


def prune_uploads(
    cases: pymongo.collection.Collection,
    source: Dict[str, Any],
    threshold: float,
    epoch: datetime = None,
    dry_run: bool = False,
) -> List[str]:
    "Prune uploads for a source"
    _id = str(s["_id"])
    msgs = []
    if (m := find_acceptable_upload(s, threshold, epoch)) is None:
        return None
    accept, reject = m
    if not s.get("hasStableIdentifiers", False):
        try:
            if not dry_run:
                mark_cases_non_uuid(cases, _id, accept, reject)
            msgs.extend(accept_reject_msg(accept, reject, True))
        except pymongo.errors.PyMongoError:
            msgs.extend(accept_reject_msg(accept, reject, True))
        try:
            if reject and not dry_run:
                cases.delete_many({"caseReference.sourceId": _id, "list": False})
            msgs.append("prune ok")
        except pymongo.errors.PyMongoError:
            msgs.append("prune fail")
            return msgs
    else:
        try:
            if not dry_run:
                mark_cases_uuid(cases, _id, accept)
            return accept_reject_msg(accept, [], True)
        except pymongo.errors.PyMongoError:
            return accept_reject_msg(accept, [], False)
    return msgs


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Mark new uploads as ingested and delete failed uploads"
    )
    parser.add_argument("-e", "--epoch", help="Epoch date for accepting uploads")
    parser.add_argument("-s", "--source", help="Source ID to prune")
    parser.add_argument(
        "-t",
        "--threshold",
        type=int,
        help="Error threshold percentage below which uploads are accepted",
    )
    parser.add_argument("-n", "--dry-run", help="Dry run", action="store_true")
    args = parser.parse_args()

    # Prefer command line arguments to environment variables
    if epoch := (args.epoch or os.environ.get("PRUNE_EPOCH", None)):
        epoch = datetime.fromisoformat(epoch)  # YYYY-MM-DD format

    threshold = args.threshold or os.environ.get("PRUNE_ERROR_THRESHOLD_PERCENT", 10)
    threshold /= 100

    if args.dry_run:
        print("dry run, no changes will be made")
    # CONN is https://docs.mongodb.com/manual/reference/connection-string/
    try:
        if (CONN := os.environ.get("CONN")) is None:
            print("Specify MongoDB connection_string in CONN")
            sys.exit(1)
        client = pymongo.MongoClient(CONN)
        db = client[os.environ.get("DB", "covid19")]
        print("database connection ok\n")
    except pymongo.errors.ConnectionFailure:
        print("database connection fail")
        sys.exit(1)

    ingestor_re = re.compile(r'.*-ingestor-(dev|qa|prod)')

    sources = (
        [db.sources.find_one({"_id": ObjectId(args.source)})]
        if args.source
        else db.sources.find(
            {"automation.parser.awsLambdaArn": {"$regex": ingestor_re}}
        )
    )
    m = []
    for s in sources:
        if result := prune_uploads(db.cases, s, threshold, epoch, args.dry_run):
            list_msgs = "\n- ".join(result)
            msg(m, f"*{s['name']}* ({str(s['_id'])}):\n- {list_msgs}")
