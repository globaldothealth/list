"""
Monitor Global.health Kubernetes pods to see if any
are stuck in Pending status for a while. If such pods are
present, notify on Slack.

IMPORTANT:
  The kubernetes Python package needs to be kept in sync
  with the EKS Kubernetes version. The compatibility matrix
  for the client Python library is at
  https://github.com/kubernetes-client/python#compatibility

NOTE:
  This will need to be updated once we move to separate
  clusters for different environments.
"""

import os
import sys
import logging
import datetime
from typing import Any

import requests
import kubernetes

logger = logging.getLogger(__name__)

SERVICES = ["curator", "data", "location"]

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")


def last_status(pod: dict[str, Any]) -> (str, datetime.datetime):
    "Returns last status for pod"
    statuses = list(pod.status.conditions)
    statuses.sort(key=(lambda k: k.last_transition_time), reverse=True)
    return statuses[0].type, statuses[0].last_transition_time


def is_service(pod: dict[str, Any]) -> bool:
    "Returns whether pod is curator, location, or data pod"
    return any(pod.metadata.name.startswith(service + "-") for service in SERVICES)


def get_pods() -> list[dict[str, Any]]:
    "Returns list of pods in the cluster"
    v1 = kubernetes.client.CoreV1Api()
    return filter(is_service, v1.list_pod_for_all_namespaces(watch=False).items)


def is_pending(pod: dict[str, Any]) -> bool:
    "Returns whether a pod is pending"
    return last_status(pod)[0] != "Ready"


def summary(pod: dict[str, Any]) -> str:
    "Returns readable one-line summary of pod status"
    status_type, status_time = last_status(pod)
    return f"- *{pod.metadata.name}* ({status_type}, {status_time})"


def notify(text: str):
    "Notifies Slack with message"
    text = text.strip()
    if text:
        text = "⚠ Some pods are stuck in pending!\n" + text
        print(text)
    if SLACK_WEBHOOK_URL and text:
        response = requests.post(SLACK_WEBHOOK_URL, json={"text": text})
        if response.status_code != 200:
            logger.error(
                f"Slack notification failed with {response.status_code}: {response.text}"
            )
            sys.exit(1)


if __name__ == "__main__":
    config = kubernetes.config.load_config()
    notify("\n".join(map(summary, filter(is_pending, get_pods()))))
