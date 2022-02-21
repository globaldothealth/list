FROM python:3.10-slim
ENV PRUNE_EPOCH 2021-07-30

COPY requirements.txt .
COPY *.py ./
COPY hooks/*.py ./hooks/

RUN pip install -r requirements.txt
ENTRYPOINT ["python", "prune_uploads.py", "--run-hooks=all"]
