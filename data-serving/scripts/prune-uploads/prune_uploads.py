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
from typing import List, Tuple, Dict, Any

from bson.objectid import ObjectId
import requests
import pymongo

import hooks.aggregate
import hooks.country_export
from logger import setup_logger


HOOKS = ["country_export", "aggregate"]
PRUNE_UPLOADS_WEBHOOK_URL = os.getenv("PRUNE_UPLOADS_WEBHOOK_URL")
DELTAS_MATCH_FIELDS = ['location',
                       'demographics',
                       'events',
                       'confirmationDate',
                       'genomeSequences',
                       'pathogens',
                       'vaccines']


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
                  prev_created_count: int = 0,
                  epoch: None | datetime = None) -> bool:
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
    deltas = upload.get('deltas', None)
    return (
        upload['status'] == "SUCCESS"
        and not deltas
        and created > prev_created_count
        and updated == 0  # non-UUID sources should never update a case
        and errors / (errors + created) <= threshold
        and "accepted" not in upload  # skip already accepted cases
        and (not epoch or upload["created"] > epoch)
    )


def is_deltas_acceptable(upload: Dict[str, Any], threshold: float,
                         prev_created_count: int = 0,
                         epoch: None | datetime = None) -> bool:
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
    deltas = upload.get('deltas', None)
    return (
        upload['status'] == "SUCCESS"
        and deltas
        and updated == 0  # non-UUID sources should never update a case
        and created + updated > 0
        and errors / (errors + created) <= threshold
        and "accepted" not in upload  # skip already accepted cases
        and (not epoch or upload["created"] > epoch)
    )


def find_acceptable_upload(
    source: Dict[str, Any], threshold: float, epoch: None | datetime = None,
    allow_decrease: bool = True
) -> None | Tuple[List[str], List[None | str], List[str]]:
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

    :return: A 3-element tuple consisting of
      (last accepted non-delta/bulk upload along with subsequent deltas [as list],
       deltas annotations list ("Add", "Del", None) [list]
       upload ids to mark for deletion [list])

      The tuple elements are returned in chronological (by 'created') order
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
        return (pending_upload_ids,
                [None] * len(pending_upload_ids),   # non-deltas
                []) if pending_upload_ids else None

    # skip rejected uploads (keep accepted and unprocessed)
    uploads = [u for u in uploads if "accepted" not in u or u['accepted']]

    # sort uploads by created date, with the most recent first
    uploads.sort(key=lambda x: x["created"], reverse=True)
    # get list of already accepted uploads (includes bulk and deltas)
    accepted_nondelta_indices = [ix for ix, u in enumerate(uploads)
                                 if ('deltas' not in u or not u['deltas'])
                                 and u.get("accepted", False)]
    last_accepted_nondelta_index = (accepted_nondelta_indices[0]
                                    if accepted_nondelta_indices else None)

    # if decreases in count numbers are not allowed, get the last count
    # (only relevant for bulk uploads replacing other bulk uploads)
    if (last_accepted_nondelta_index is not None) and (not allow_decrease):
        prev_created_count = \
            uploads[last_accepted_nondelta_index]["summary"]\
            .get("numCreated", 0)
    else:
        prev_created_count = 0

    # check whether any new bulk uploads have been parsed
    new_bulk_uploads = [is_acceptable(u, threshold, prev_created_count, epoch)
                        for u in uploads]
    try:
        new_bulk_ix = new_bulk_uploads.index(True)
    except ValueError:
        new_bulk_ix = None

    # construct boolean vector of uploads to accept, defaulting all to False
    accept_new_uploads = [False] * len(uploads)

    # is a new bulk upload available?
    if new_bulk_ix is not None:
        # accept new bulk upload
        accept_new_uploads[new_bulk_ix] = True
        # reject all uploads prior to this upload
        accept_new_uploads[(new_bulk_ix + 1):] = \
            [False] * (len(uploads) - new_bulk_ix - 1)
        # test whether newer uploads are acceptable as deltas
        accept_new_uploads[:new_bulk_ix] = [
            is_deltas_acceptable(u, threshold, prev_created_count, epoch)
            for u in uploads[:new_bulk_ix]]
    elif last_accepted_nondelta_index:
        # reject all uploads prior to the last accepted bulk upload
        accept_new_uploads[(last_accepted_nondelta_index + 1):] = \
            [False] * (len(uploads) - last_accepted_nondelta_index - 1)
        # test whether newer uploads are acceptable as deltas
        accept_new_uploads[:last_accepted_nondelta_index] = [
            is_deltas_acceptable(u, threshold, prev_created_count, epoch)
            for u in uploads[:last_accepted_nondelta_index]]
    else:
        # no new bulk upload available, and no existing bulk upload identified
        return None

    # build acceptance list, delta annotations
    accept_list = _ids(list(compress(uploads, accept_new_uploads)))
    deltas_annot = list(compress([u.get("deltas", None) for u in uploads],
                                 accept_new_uploads))
    # reject all uploads that are not accepted, but are also not in-progress
    #  (prefer list comprehension over sets to preserve ordering)
    uploads_not_accepted = _ids(compress(uploads,
                                         map(lambda x: not x,
                                             accept_new_uploads)))
    uploads_in_progress = _ids(filter(
        lambda u: u['status'] == 'IN_PROGRESS', uploads))
    reject_list = \
        [x for x in uploads_not_accepted if x not in uploads_in_progress]

    # Revert to chronological order
    accept_list.reverse()
    deltas_annot.reverse()
    reject_list.reverse()

    # don't reject anything if nothing is being accepted
    if not accept_list:
        return None
    return accept_list, deltas_annot, reject_list


def print_fields(response):
    fields = [f for f in dir(response) if not f.startswith('_')]
    results = [getattr(response, f) for f in fields]
    out_str = []
    for f, r in zip(fields, results):
        out_str.append(f"{f}={r}")
    return ', '.join(out_str)


def mark_cases_non_uuid_deltas_del(
        deltas_del_cases: pymongo.cursor.Cursor,
        cases: pymongo.collection.Collection,
        source_id: str) -> List[ObjectId]:
    '''Traverse cases and mark each case for list removal

    Sets cases for removal by marking list=False for all items specified in
    deltas_del_cases.

    Returns the number of cases successfully processed, along with their
    associated caseId's (which can be used for rollback if needed)
    '''
    modified_cases: List[ObjectId] = []
    for item in deltas_del_cases:
        match_criteria = dict(zip(DELTAS_MATCH_FIELDS,
                                  [item[it] for it in DELTAS_MATCH_FIELDS]))
        match_criteria['caseReference.sourceId'] = source_id
        match_criteria['list'] = True
        # 1. Identify a specific case to change (caseId can be used for rollback)
        respFindCase = cases.find_one(match_criteria)
        match_criteria['_id'] = respFindCase['_id']
        # 2. Modify the identified case
        response = cases.update_one(
            match_criteria,
            {"$set": {"list": False}}
        )
        if response.modified_count != 1:
            # Failed to update record
            logging.error("Could not DELETE delta item from line list, "
                          f"response: {print_fields(response)}")
            return modified_cases
        modified_cases.append(match_criteria['_id'])
    return modified_cases


def mark_cases_non_uuid_deltas_del_rollback(
        cases: pymongo.collection.Collection,
        modified_cases: List[ObjectId]) -> List[ObjectId]:
    rollback_cases: List[ObjectId] = []
    for item in modified_cases:
        match_criteria = {'_id': item}
        response = cases.update_one(
            match_criteria,
            {"$set": {"list": True}}
        )
        if response.modified_count != 1:
            # Failed to rollback record
            logging.error("Could not ROLLBACK delta item from line list, "
                          f"response: {print_fields(response)}")
            return rollback_cases
        rollback_cases.append(item)
    return rollback_cases


def mark_cases_non_uuid(
    cases: pymongo.collection.Collection,
    sources: pymongo.collection.Collection,
    source_id: str,
    accept: List[str],
    reject: List[str],
    deltas_annot: List[str | None]
):
    assert len(accept) == len(deltas_annot), \
        "Delta states length does not match accept length."
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
        mark_upload(sources, source_id, reject, accept=False)
    if accept:
        logging.info("  ... accept")
        # deltas can be Add, Del, or None(treat as Add), so traverse uploads
        for accept_item, deltas_state in zip(accept, deltas_annot):
            if (not deltas_state) or (deltas_state == 'Add'):
                cases.update_many(
                    {
                        "caseReference.sourceId": source_id,
                        "caseReference.uploadIds": [accept_item]
                    },
                    {"$set": {"list": True}},
                )
            elif deltas_state == 'Del':
                # To remove an item from the line list we need to search for each
                # DEL item in previous sucessful 'main' and 'delta' uploads, then
                # mark that item as list=False. This DEL upload will then be
                # marked as accepted.
                logging.debug("Removal deltas: find last compatible entry "
                              "and mark as list=False")
                # Traverse and process each DEL case in the upload
                deltas_del_cases_count = cases.count_documents({
                    "caseReference.sourceId": source_id,
                    "caseReference.uploadIds": [accept_item]
                })
                deltas_del_cases = cases.find({
                    "caseReference.sourceId": source_id,
                    "caseReference.uploadIds": [accept_item]
                })
                modified_cases = mark_cases_non_uuid_deltas_del(
                    deltas_del_cases, cases, source_id)
                if len(modified_cases) != deltas_del_cases_count:
                    logging.info("Performing ROLLBACK of deltas... "
                                 f"(source_id={source_id}, "
                                 f"upload_id={accept_item}, "
                                 f"cases={modified_cases})")
                    mark_cases_non_uuid_deltas_del_rollback(cases,
                                                            modified_cases)
                    # set deltas upload to 'reject'
                    logging.info("Marking deltas file as 'reject'.")
                    mark_upload(sources, source_id, [accept_item], accept=False)
                    return   # stop ingesting (wait for next bulk upload)
            else:
                assert False, ("Unknown deltas state encountered: "
                               "{deltas_state}")
            logging.info("\n".join(accept_reject_msg([accept_item], [])))
            mark_upload(sources, source_id, [accept_item], accept=True)


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
    epoch: None | datetime = None,
    dry_run: bool = False,
    allow_decrease: bool = True,
) -> List[str]:
    "Prune uploads for a source"
    _id = str(source["_id"])
    msgs = []
    if (m := find_acceptable_upload(source, threshold, epoch,
                                    allow_decrease=allow_decrease)) is None:
        return []
    accept, deltas_annot_list, reject = m
    if not dry_run:
        logging.info(f"source {_id} {source['name']}")
    if not s.get("hasStableIdentifiers", False):
        try:
            if not dry_run:
                mark_cases_non_uuid(cases,
                                    sources,
                                    _id,
                                    accept,
                                    reject,
                                    deltas_annot_list)
            msgs.extend(accept_reject_msg(accept, reject, True, prefix='-'))
        except pymongo.errors.PyMongoError as err:
            logging.info(accept_reject_msg(accept, reject, False))
            logging.debug(err)
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
        except pymongo.errors.PyMongoError as err:
            logging.info(accept_reject_msg(accept, [], False))
            logging.debug(err)
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
        if result := prune_uploads(db.cases, db.sources, s, threshold, epoch,
                                   dry_run=args.dry_run,
                                   allow_decrease=True):  # Needed to permit processing of deltas
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
