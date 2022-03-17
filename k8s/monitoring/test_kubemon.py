import datetime

import pytest

from kubernetes.client import (
    V1Pod,
    V1ObjectMeta,
    V1PodStatus,
    V1PodCondition,
)

from kubemon import (
    last_status,
    is_service,
    is_pending,
    summary,
)

time = datetime.datetime(2022, 3, 17, 12)
hourAndHalfAgo = time - datetime.timedelta(seconds=1800)
twoHoursAgo = hourAndHalfAgo - datetime.timedelta(seconds=1800)

podReady = V1Pod(
    api_version="1.19",
    kind="Pod",
    metadata=V1ObjectMeta(name="curator-prod"),
    status=V1PodStatus(
        conditions=[
            V1PodCondition(last_transition_time=time, status=True, type="Ready"),
            V1PodCondition(
                last_transition_time=hourAndHalfAgo, status=True, type="ContainersReady"
            ),
        ]
    ),
)

podNotReady = V1Pod(
    api_version="1.19",
    kind="Pod",
    metadata=V1ObjectMeta(name="curator-prod"),
    status=V1PodStatus(
        conditions=[
            V1PodCondition(
                last_transition_time=hourAndHalfAgo, status=True, type="ContainersReady"
            ),
        ]
    ),
)

podNotRelevant = V1Pod(
    api_version="1.19",
    kind="Pod",
    metadata=V1ObjectMeta(name="foobar"),
    status=V1PodStatus(
        conditions=[
            V1PodCondition(
                last_transition_time=hourAndHalfAgo, status=True, type="Ready"
            ),
        ]
    ),
)


def test_last_status():
    assert last_status(podReady) == ("Ready", time)


@pytest.mark.parametrize(
    "pod,expected", [(podReady, False), (podNotReady, True), (podNotRelevant, False)]
)
def test_is_pending(pod, expected):
    assert is_pending(pod) == expected


@pytest.mark.parametrize(
    "pod,expected", [(podReady, True), (podNotReady, True), (podNotRelevant, False)]
)
def test_is_service(pod, expected):
    assert is_service(pod) == expected


def test_summary():
    assert summary(podReady) == "- *curator-prod* (Ready, 2022-03-17 12:00:00)"
