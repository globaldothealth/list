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
import base64
import logging
import datetime
from typing import Any
from pathlib import Path

import requests
import kubernetes


def setup_logger():
    h = logging.StreamHandler(sys.stdout)
    rootLogger = logging.getLogger()
    rootLogger.addHandler(h)
    rootLogger.setLevel(logging.INFO)


SERVICES = ["curator", "data", "location"]
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")


def ensure_kubeconfig_exists():
    if (
        kubeconfig_path := Path.home() / ".kube" / "config"
    ).exists() and kubeconfig_path.stat().st_size > 0:
        logging.info("Using existing ~/.kube/config")
    elif KUBECONFIG_VALUE := os.getenv("KUBECONFIG_VALUE"):
        logging.info("Writing base64 encoded KUBECONFIG_VALUE to ~/.kube/config")
        (Path.home() / ".kube").mkdir(exist_ok=True)
        logging.info(kubeconfig_path)
        kubeconfig_path.write_text(base64.b64decode(KUBECONFIG_VALUE).decode("utf-8"))
    elif os.getenv("ENV") == "test":
        logging.info("Skipping kubernetes configuration in testing")
    else:
        logging.error("Neither ~/.kube/config or KUBECONFIG_VALUE exists, aborting")
        sys.exit(1)


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


def is_not_ready(pod: dict[str, Any]) -> bool:
    "Returns whether a pod is not ready"
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
        logging.info(text)
    if SLACK_WEBHOOK_URL and text:
        response = requests.post(SLACK_WEBHOOK_URL, json={"text": text})
        if response.status_code != 200:
            logging.error(
                f"Slack notification failed with {response.status_code}: {response.text}"
            )
            sys.exit(1)


if __name__ == "__main__":
    ensure_kubeconfig_exists()
    config = kubernetes.config.load_config()
    notify("\n".join(map(summary, filter(is_not_ready, get_pods()))))
