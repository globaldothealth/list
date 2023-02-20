# prune_uploads.py -- Mark new uploads as ingested and delete failed uploads

# This is a script that should be run periodically that sets every upload
# older than the last acceptable upload to list = false (for non-UUID
# sources). For UUID sources, set everything to list = true. After marking,
# this deletes everything with list = false.

import argparse
from datetime import datetime
import logging
import os
import re
import sys
from itertools import compress
from typing import Optional, List, Tuple, Dict, Any

from bson.objectid import ObjectId
import requests
import pymongo

import hooks.aggregate
import hooks.country_export
from logger import setup_logger


HOOKS = ["country_export", "aggregate"]
PRUNE_UPLOADS_WEBHOOK_URL = os.getenv("PRUNE_UPLOADS_WEBHOOK_URL")


def _ids(xs):
    return [str(x["_id"]) for x in xs]


def notify(string: str) -> bool:
    if not PRUNE_UPLOADS_WEBHOOK_URL:
        raise ValueError("Missing environment variable PRUNE_UPLOADS_WEBHOOK_URL")
    if not string:
        raise ValueError("notify() requires non-empty string")
    response = requests.post(PRUNE_UPLOADS_WEBHOOK_URL, json={"text": string})
    return response.status_code == 200


def accept_reject_msg(accept, reject, success=True, prefix=' '):
    m = []
    ok = "ok" if success else "fail"
    if accept:
        m.extend([f"{prefix} accept {a} {ok}" for a in accept])
    if reject:
        m.extend([f"{prefix} reject {r} {ok}" for r in reject])
    return m


def is_acceptable(upload: Dict[str, Any], threshold: float,
                  prev_created_count: int = 0) -> bool:
    """Whether an upload is acceptable

    :param upload: Upload data as a dictionary
    :param threshold: Threshold ratio of errors above which an upload
    is not accepted
    :param prev_created_count: Created count of previous upload

    :return: Whether the upload is acceptable
    """
    created = upload['summary'].get('numCreated', 0)
    updated = upload['summary'].get('numUpdated', 0)
    errors = upload['summary'].get('numError', 0)
    deltas = upload.get('deltas', False)
    return (
        upload['status'] == "SUCCESS"
        and not deltas
        and created > prev_created_count
        and updated == 0  # non-UUID sources should never update a case
        and errors / (errors + created) <= threshold
        and "accepted" not in upload  # skip already accepted cases
    )


def is_deltas_acceptable(upload: Dict[str, Any], threshold: float,
                  prev_created_count: int = 0) -> bool:
    """Whether a deltas upload is acceptable

    :param upload: Upload data as a dictionary
    :param threshold: Threshold ratio of errors above which an upload
    is not accepted
    :param prev_created_count: Created count of previous upload

    :return: Whether the upload is acceptable
    """
    created = upload['summary'].get('numCreated', 0)
    updated = upload['summary'].get('numUpdated', 0)
    errors = upload['summary'].get('numError', 0)
    deltas = upload.get('deltas', False)
    return (
        upload['status'] == "SUCCESS"
        and deltas
        and updated == 0  # non-UUID sources should never update a case
        and errors / (errors + created) <= threshold
        and "accepted" not in upload  # skip already accepted cases
    )


def find_acceptable_upload(
    source: Dict[str, Any], threshold: float, epoch: datetime = None,
    allow_decrease: bool = False
) -> Optional[Tuple[List[str], List[str]]]:
    """Finds uploads that can be accepted for inclusion in line list

    :param source: Source data
    :param threshold: Threshold ratio of errors above which
      an upload is not accepted.
    :param epoch: Epoch date after which acceptable uploads will be considered
    :param allow_decrease: Whether uploads with fewer cases are allowed

    epoch is the initial datetime after which we should consider non-UUID
    sources to either have data only corresponding to a single upload, or
    consist of a single batch upload followed by multiple 'deltas' uploads.

    If not specified, considers the last acceptable upload to be
    contain the entire dataset.

    :return: A tuple of
      (last acceptable upload, list of uploads to mark for deletion).
      If no acceptable upload is found, returns None
    """
    if not (uploads := source.get("uploads", [])):
        return None

    if source.get("hasStableIdentifiers", False):
        pending_upload_ids = _ids(
            u for u in uploads
            if u['status'] != "IN_PROGRESS"
            and "accepted" not in u
        )
        return (pending_upload_ids, []) if pending_upload_ids else None

    # skip rejected uploads
    uploads = [u for u in uploads if "accepted" not in u or u['accepted']]

    # sort uploads, with most recent being the first
    uploads.sort(key=lambda x: x["created"], reverse=True)
    accepted_uploads = [u for u in uploads if u.get("accepted", False)]
    if accepted_uploads and not allow_decrease:
        prev_created_count = accepted_uploads[0]["summary"].get("numCreated", 0)
    else:
        prev_created_count = 0
    accept_uploads = [is_acceptable(u, threshold, prev_created_count) for u in uploads]
    try:
        accept_idx = accept_uploads.index(True)
    except ValueError:
        accept_idx = -1  # no acceptable upload found
    #import code; code.interact(local=dict(globals(), **locals()))
    accept_uploads[:accept_idx] = [is_deltas_acceptable(u, threshold,
                                                        prev_created_count)
                                     for u in uploads[:accept_idx]]
    if accept_idx > -1 and (not epoch or uploads[accept_idx]["created"] > epoch):
        accept_list = _ids(list(compress(uploads, accept_uploads)))
        # Reject uploads older than last successful upload
        # Also mark for deletion later non-accepted uploads that are not IN_PROGRESS
        reject_list = _ids(uploads[accept_idx+1:] +
                           [u for u in filter(lambda x: not x, uploads[:accept_idx])
                            if u["status"] != "IN_PROGRESS"])
        return accept_list, reject_list
    return None


def mark_cases_non_uuid(
    cases: pymongo.collection.Collection,
    sources: pymongo.collection.Collection,
    source_id: str,
    accept: List[str],
    reject: List[str],
):
    if reject:
        logging.info("  ... reject")
        cases.update_many(
            {
                "caseReference.sourceId": source_id,
                "caseReference.uploadIds": {"$in": reject},
            },
            {"$set": {"list": False}},
        )
        logging.info("\n".join(accept_reject_msg([], reject)))
    logging.info("  ... accept")
    cases.update_many(
        {"caseReference.sourceId": source_id, "caseReference.uploadIds": accept},
        {"$set": {"list": True}},
    )
    logging.info("\n".join(accept_reject_msg(accept, [])))
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
    logging.info("\n".join([f"  mark-upload {u} {accept}" for u in upload_ids]))


def mark_cases_uuid(
    cases: pymongo.collection.Collection,
    sources: pymongo.collection.Collection,
    source_id,
    accept: List[str],
):
    "Marks cases for UUID sources"
    logging.info("  ... accept")
    cases.update_many(
        {
            "caseReference.sourceId": source_id,
            "caseReference.uploadIds": {"$in": accept},
        },
        {"$set": {"list": True}},
    )
    logging.info("\n".join(accept_reject_msg(accept, [])))
    mark_upload(sources, source_id, accept, accept=True)


def prune_uploads(
    cases: pymongo.collection.Collection,
    sources: pymongo.collection.Collection,
    source: Dict[str, Any],
    threshold: float,
    epoch: datetime = None,
    dry_run: bool = False,
    allow_decrease: bool = False,
) -> List[str]:
    "Prune uploads for a source"
    _id = str(source["_id"])
    msgs = []
    if (m := find_acceptable_upload(source, threshold, epoch)) is None:
        return []
    accept, reject = m
    if not dry_run:
        logging.info(f"source {_id} {source['name']}")
    if not s.get("hasStableIdentifiers", False):
        try:
            if not dry_run:
                mark_cases_non_uuid(cases, sources, _id, accept, reject)
            msgs.extend(accept_reject_msg(accept, reject, True, prefix='-'))
        except pymongo.errors.PyMongoError:
            logging.info(accept_reject_msg(accept, reject, False))
            msgs.extend(accept_reject_msg(accept, reject, False, prefix='-'))
        try:
            if reject and not dry_run:
                logging.info("  ... prune")
                cases.delete_many({"caseReference.sourceId": _id, "list": False})
            if not dry_run:
                logging.info("  prune ok")
            msgs.append("- prune ok")
        except pymongo.errors.PyMongoError:
            logging.info("  prune fail")
            msgs.append("- prune fail")
            return msgs
    else:
        try:
            if not dry_run:
                mark_cases_uuid(cases, sources, _id, accept)
            return accept_reject_msg(accept, [], True, prefix='-')
        except pymongo.errors.PyMongoError:
            logging.info(accept_reject_msg(accept, [], False))
            return accept_reject_msg(accept, [], False, prefix='-')
    return msgs


def get_selected_hooks(run_hooks):
    if not run_hooks:
        return []
    if run_hooks == "all":
        return HOOKS
    return [hook for hook in run_hooks.split(',') if hook in HOOKS]


if __name__ == "__main__":

    setup_logger()
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
    parser.add_argument("-d", "--allow-decrease",
                        help="Allow decrease in cases (non-UUID)", action="store_true")
    parser.add_argument("-r", "--run-hooks",
                        help="Run hooks after prune finishes. Specify 'all' to run all hooks")
    parser.add_argument("--env",
                        help="Which environment to use for hooks (default: prod)")
    args = parser.parse_args()

    # Prefer command line arguments to environment variables
    if epoch := (args.epoch or os.environ.get("PRUNE_EPOCH", None)):
        epoch = datetime.fromisoformat(epoch)  # YYYY-MM-DD format
    else:
        epoch = None
    logging.info(f"Epoch: {epoch}")

    threshold = args.threshold or os.environ.get("PRUNE_ERROR_THRESHOLD_PERCENT", 10)
    threshold = int(threshold) / 100
    logging.info(f"Threshold: {threshold}")

    env = args.env or os.environ.get("ENV", "prod")
    logging.info(f"Environment: {env}")

    if args.dry_run:
        logging.info("Dry run, no changes will be made")
    # CONN is https://docs.mongodb.com/manual/reference/connection-string/
    try:
        if (CONN := os.environ.get("CONN")) is None:
            logging.error("Specify MongoDB connection_string in CONN")
            sys.exit(1)
        client = pymongo.MongoClient(CONN)
        db = client[os.environ.get("DB", "covid19")]
        logging.info("Database connection ok\n")
    except pymongo.errors.ConnectionFailure:
        logging.error("Database connection fail")
        sys.exit(1)

    # This restricts prune-uploads to run on sources with automated
    # ingestion setup only. prune-uploads should NOT be run on arbitrary
    # sources which could have been used for one-off uploads
    ingestor_re = re.compile(r'.*-ingestor-(dev|qa|prod)')

    sources = (
        [db.sources.find_one({"_id": ObjectId(args.source)})]
        if args.source
        else db.sources.find(
            {"automation.parser.awsLambdaArn": {"$regex": ingestor_re}}
        )
    )
    m = []
    ingested_sources = []
    for s in sources:
        if result := prune_uploads(db.cases, db.sources, s, threshold,
                                   epoch, args.dry_run, args.allow_decrease):
            ingested_sources.append(s)
            list_msgs = "\n".join(result)
            m.append(f"*{s['name']}* ({str(s['_id'])}):\n{list_msgs}")

    if args.dry_run:
        logging.info("\n".join(m))

    notify("\n".join(m))

    selected_hooks = get_selected_hooks(args.run_hooks)
    if not ingested_sources:
        logging.info("No sources were ingested, skipping hooks.")
        sys.exit(0)

    if "country_export" in selected_hooks:
        try:
            hooks.country_export.run(ingested_sources, env, args.dry_run)
        except Exception as e:
            logging.error(e)
            notify(str(e))
    if "aggregate" in selected_hooks:
        try:
            hooks.aggregate.run(ingested_sources, env, args.dry_run)
        except Exception as e:
            logging.error(e)
            notify(str(e))
