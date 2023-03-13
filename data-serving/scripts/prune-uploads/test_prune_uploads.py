import pytest
import copy
from bson.objectid import ObjectId
from datetime import datetime
from enum import Enum

from prune_uploads import find_acceptable_upload, HOOKS, get_selected_hooks

# If the ratio of numError / numCreated is greater than this,
# do not accept upload
ERROR_THRESHOLD = 0.1

Status = Enum("Status", "SUCCESS IN_PROGRESS ERROR")


def _u(i, status, date, created=0, errors=0, updated=0, accepted=None, deltas=None):
    u = {
        "_id": ObjectId(i),
        "status": status.name,
        "created": datetime.fromisoformat(date),
        "summary": {"numCreated": created, "numUpdated": updated, "numError": errors},
    }
    if accepted is not None:
        u["accepted"] = accepted
    if deltas is not None:
        u["deltas"] = deltas  # "Add", "Del", None
    return u


# ##################################
# ### Pre- delta-ingestion tests ###
# ##################################

S0 = {
    "_id": ObjectId("123456789012345678901231"),
    "hasStableIdentifiers": True,
    "uploads": [
        _u("60f733dcfae8bf76717d598e", Status.SUCCESS, "2021-01-01", 100),
        _u("60f734296e50eb2592992fb0", Status.ERROR, "2020-12-31", 5),
        _u("60f7343a6e50eb2592992fb1", Status.ERROR, "2020-12-25", 0, accepted=True),
    ],
}

S0_all_accepted = {
    "_id": ObjectId("123456789012345678901231"),
    "hasStableIdentifiers": True,
    "uploads": [
        _u("60f733dcfae8bf76717d598e", Status.SUCCESS, "2021-01-01", 100, accepted=True),
        _u("60f734296e50eb2592992fb0", Status.ERROR, "2020-12-31", 5, accepted=True),
        _u("60f7343a6e50eb2592992fb1", Status.ERROR, "2020-12-25", 0, accepted=True),
    ],
}

T0 = [
    (S0, (["60f733dcfae8bf76717d598e", "60f734296e50eb2592992fb0"], [None, None], [])),
    (S0_all_accepted, None)
]
S1 = {"_id": ObjectId("123456789012345678901232"), "uploads": []}

S2 = {
    "_id": ObjectId("123456789012345678901230"),
    "uploads": [
        _u("60f733dcfae8bf76717d598e", Status.SUCCESS, "2020-01-01", 100, 5),
        _u("60f734296e50eb2592992fb0", Status.ERROR, "2020-12-25"),
        _u("60f7343a6e50eb2592992fb1", Status.ERROR, "2020-12-31"),
        _u("60f7343a6e50eb2592992fb2", Status.SUCCESS, "2021-02-11", 10, 1),
        _u("60f7343a6e50eb2592992fc2", Status.SUCCESS, "2021-02-12", 10, 2),
        # ^ rejected as errors above threshold
        _u("60f7343a6e50eb2592992fb3", Status.ERROR, "2021-05-05"),
        _u("60f7343a6e50eb2592992fb4", Status.ERROR, "2022-02-13"),
        _u("60f7343a6e50eb2592992fb5", Status.IN_PROGRESS, "2022-02-14"),
    ],
}

S2_accepted = {
    "_id": ObjectId("123456789012345678901230"),
    "uploads": [
        _u("60f733dcfae8bf76717d598e", Status.SUCCESS, "2020-01-01", 100, 5, accepted=True),
        _u("60f734296e50eb2592992fb0", Status.ERROR, "2020-12-25", accepted=False),
        _u("60f7343a6e50eb2592992fb1", Status.ERROR, "2020-12-31", accepted=False),
        _u("60f7343a6e50eb2592992fb2", Status.SUCCESS, "2021-02-11", 101, 1),
        _u("60f7343a6e50eb2592992fc2", Status.SUCCESS, "2021-02-12", 100, 2),
        # ^ rejected as number of cases not >100, last ingestion on 1/1
        _u("60f7343a6e50eb2592992fb3", Status.ERROR, "2021-05-05", accepted=False),
        _u("60f7343a6e50eb2592992fb4", Status.ERROR, "2022-02-13", accepted=False),
        _u("60f7343a6e50eb2592992fb5", Status.IN_PROGRESS, "2022-02-14"),
    ],
}


S2_expected = (
    ["60f7343a6e50eb2592992fb2"],    # accept_list
    [None],                          # deltas annotations
    [
        "60f733dcfae8bf76717d598e",  # reject list (ordered as above)
        "60f734296e50eb2592992fb0",
        "60f7343a6e50eb2592992fb1",
        "60f7343a6e50eb2592992fc2",
        "60f7343a6e50eb2592992fb3",
        "60f7343a6e50eb2592992fb4",
    ],
)

# skip rejected uploads, but reject older accepted
S2_accepted_expected = (
    ["60f7343a6e50eb2592992fb2"],
    [None],
    [
        "60f733dcfae8bf76717d598e",
        "60f7343a6e50eb2592992fc2",
    ],
)


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

# Skip accepted uploads
S4 = {
    "_id": ObjectId("123456789012345678901233"),
    "hasStableIdentifiers": False,
    "uploads": [
        _u("60f734296e50eb2592992fb0", Status.SUCCESS, "2020-12-31", 20, 1, accepted=True),
    ],
}

T = [
    (S1, None),
    (S2, S2_expected),
    (S2_accepted, S2_accepted_expected),
    (S3, None),
    (S4, None),
]

T_decrease = [
    (
        S2_accepted,
        (
            ["60f7343a6e50eb2592992fc2"],
            [None],
            [
                "60f733dcfae8bf76717d598e",
                "60f7343a6e50eb2592992fb2",
            ],
        ),
    )
]


@pytest.mark.parametrize("source,expected", T)
def test_find_acceptable_upload(source, expected):
    assert find_acceptable_upload(source, ERROR_THRESHOLD,
                                  allow_decrease=False) == expected


@pytest.mark.parametrize("source,expected", T_decrease)
def test_find_acceptable_upload_allow_decrease(source, expected):
    assert (
        find_acceptable_upload(source, ERROR_THRESHOLD,
                               allow_decrease=True) == expected
    )


@pytest.mark.parametrize("source,expected", [(x, None) for x in [S1, S2, S3]])
def test_find_acceptable_upload_with_epoch(source, expected):
    assert (
        find_acceptable_upload(source, ERROR_THRESHOLD, datetime(2021, 3, 1),
                               allow_decrease=False) == expected
    )


@pytest.mark.parametrize("source,expected", T0)
def test_find_acceptable_upload_uuid(source, expected):
    assert find_acceptable_upload(source, ERROR_THRESHOLD,
                                  allow_decrease=False) == expected


@pytest.mark.parametrize(
    "source,expected",
    [(None, []), ("all", HOOKS), ("country_export", ["country_export"])],
)
def test_get_selected_hooks(source, expected):
    assert get_selected_hooks(source) == expected


# ###################################
# ### Post- delta-ingestion tests ###
# ###################################


# bulk+deltas (with prior bulk upload)
SD1 = {
    "_id": ObjectId("123456789012345678901230"),
    "uploads": [
        _u("60f733dcfae8bf76717d598e", Status.SUCCESS, "2020-01-01", 100, 5, accepted=True),  # bulk upload
        _u("60f734296e50eb2592992fb0", Status.ERROR, "2020-12-25"),
        _u("60f7343a6e50eb2592992fb1", Status.SUCCESS, "2020-12-31", 101),  # new bulk upload
        _u("60f7343a6e50eb2592992fb2", Status.SUCCESS, "2021-02-11", 18, 1, deltas="Add"),  # delta
        _u("60f7343a6e50eb2592992fc2", Status.SUCCESS, "2021-02-12", 5, 0, deltas="Del"),  # delta
        _u("60f7343a6e50eb2592992fb5", Status.IN_PROGRESS, "2022-02-14"),  # in progress
    ],
}
SD1_expected = (
    [   # accept_list
        "60f7343a6e50eb2592992fb1",
        "60f7343a6e50eb2592992fb2",
        "60f7343a6e50eb2592992fc2"],
    [   # delta annotations
        None,
        "Add",
        "Del"],
    [   # reject list
        "60f733dcfae8bf76717d598e",
        "60f734296e50eb2592992fb0",
    ],
)

# bulk+deltas (no previous bulk upload)
SD2 = copy.deepcopy(SD1)
SD2['uploads'].remove(SD2['uploads'][0])
SD2_expected = copy.deepcopy(SD1_expected)
SD2_expected[2].remove(SD2_expected[2][0])

# add a new bulk upload at the end (should be only ingestion)
#  also simulates rollback when deltas reject and the next upload is bulk
SD3 = copy.deepcopy(SD1)
SD3['uploads'].append(
    _u("60f7343a6e50eb2592992ddd", Status.SUCCESS, "2022-12-31", 25))
SD3_expected = (
    ["60f7343a6e50eb2592992ddd"],
    [None],
    ["60f733dcfae8bf76717d598e",
     "60f734296e50eb2592992fb0",
     "60f7343a6e50eb2592992fb1",
     "60f7343a6e50eb2592992fb2",
     "60f7343a6e50eb2592992fc2"],
)

TD = [
    (SD1, SD1_expected),  # bulk+deltas (with prior bulk upload)
    (SD2, SD2_expected),  # bulk+deltas (no previous bulk upload)
    (SD3, SD3_expected),  # add a new bulk upload at the end
]


@pytest.mark.parametrize("source,expected", TD)
def test_find_acceptable_upload_deltas(source, expected):
    assert find_acceptable_upload(source, ERROR_THRESHOLD) == expected
