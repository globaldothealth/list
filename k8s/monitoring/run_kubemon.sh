#!/bin/sh
# env: KUBECONFIG
if [ ! -f ~/.kube/config ]; then
  mkdir -p ~/.kube
  echo "$KUBECONFIG" | base64 -d > ~/.kube/config
fi
python3 /app/kubemon.py
