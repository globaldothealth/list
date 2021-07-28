import pytest
from bson.objectid import ObjectId
from datetime import datetime
from enum import Enum

from prune_uploads import find_acceptable_upload

# If the ratio of numError / numCreated is greater than this,
# do not accept upload
ERROR_THRESHOLD = 0.1

Status = Enum("Status", "SUCCESS IN_PROGRESS ERROR")


def _u(i, status, date, created=0, errors=0, updated=0, accepted=None):
    u = {
        "_id": ObjectId(i),
        "status": status.name,
        "created": datetime.fromisoformat(date),
        "summary": {"numCreated": created, "numUpdated": updated, "numError": errors},
    }
    if accepted is not None:
        u['accepted'] = accepted
    return u


S0 = {"_id": ObjectId("123456789012345678901231"), "hasStableIdentifiers": True}
S1 = {"_id": ObjectId("123456789012345678901232"), "uploads": []}

S2 = {
    "_id": ObjectId("123456789012345678901230"),
    "uploads": [
        _u("60f733dcfae8bf76717d598e", Status.SUCCESS, "2021-01-01", 100, 5),
        _u("60f734296e50eb2592992fb0", Status.ERROR, "2020-12-31"),
        _u("60f7343a6e50eb2592992fb1", Status.ERROR, "2020-12-25"),
        _u("60f7343a6e50eb2592992fb2", Status.SUCCESS, "2021-02-11", 10, 1),
        _u("60f7343a6e50eb2592992fc2", Status.SUCCESS, "2021-02-12", 10, 2),
        # ^ rejected as errors above threshold
        _u("60f7343a6e50eb2592992fb3", Status.ERROR, "2020-05-05"),
        _u("60f7343a6e50eb2592992fb4", Status.ERROR, "2020-02-13"),
        _u("60f7343a6e50eb2592992fb5", Status.IN_PROGRESS, "2021-02-14"),
    ],
}

S2_accepted = {
    "_id": ObjectId("123456789012345678901230"),
    "uploads": [
        _u("60f733dcfae8bf76717d598e", Status.SUCCESS, "2021-01-01", 100, 5, accepted=True),
        _u("60f734296e50eb2592992fb0", Status.ERROR, "2020-12-31", accepted=False),
        _u("60f7343a6e50eb2592992fb1", Status.ERROR, "2020-12-25", accepted=False),
        _u("60f7343a6e50eb2592992fb2", Status.SUCCESS, "2021-02-11", 10, 1),
        _u("60f7343a6e50eb2592992fc2", Status.SUCCESS, "2021-02-12", 10, 2),
        # ^ rejected as errors above threshold
        _u("60f7343a6e50eb2592992fb3", Status.ERROR, "2020-05-05", accepted=False),
        _u("60f7343a6e50eb2592992fb4", Status.ERROR, "2020-02-13", accepted=False),
        _u("60f7343a6e50eb2592992fb5", Status.IN_PROGRESS, "2021-02-14"),
    ],
}


S2_expected = (
    ["60f7343a6e50eb2592992fb2"],
    [
        "60f733dcfae8bf76717d598e",
        "60f734296e50eb2592992fb0",
        "60f7343a6e50eb2592992fb1",
        "60f7343a6e50eb2592992fb3",
        "60f7343a6e50eb2592992fb4",
        "60f7343a6e50eb2592992fc2",
    ],
)

S2_accepted_expected = ["60f7343a6e50eb2592992fb2"], ["60f7343a6e50eb2592992fc2"]

S3 = {
    "_id": ObjectId("123456789012345678901233"),
    "hasStableIdentifiers": False,
    "uploads": [
        _u("60f734296e50eb2592992fb0", Status.ERROR, "2020-12-31"),
        _u("60f7343a6e50eb2592992fb1", Status.SUCCESS, "2020-12-25", 10, 1, 1),
        # ^ rejected as updates > 0; invalid for non-UUID sources
        _u("60f7343a6e50eb2592992fb3", Status.ERROR, "2020-05-05"),
        _u("60f7343a6e50eb2592992fb4", Status.IN_PROGRESS, "2021-01-01"),
    ],
}

T = [(S1, None), (S2, S2_expected), (S2_accepted, S2_accepted_expected), (S3, None)]


@pytest.mark.parametrize("source,expected", T)
def test_find_acceptable_upload(source, expected):
    assert find_acceptable_upload(source, ERROR_THRESHOLD) == expected


@pytest.mark.parametrize("source,expected", [(x, None) for x in [S1, S2, S3]])
def test_find_acceptable_upload_with_epoch(source, expected):
    assert (
        find_acceptable_upload(source, ERROR_THRESHOLD, datetime(2021, 3, 1))
        == expected
    )

