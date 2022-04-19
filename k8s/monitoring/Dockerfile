FROM python:3.10
ENV PIP_DISABLE_PIP_VERSION_CHECK=on
RUN apt-get update && apt-get -y install awscli
RUN pip install poetry
WORKDIR /app
COPY poetry.lock pyproject.toml /app/
RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-dev
COPY run_kubemon.sh kubemon.py /app/
ENTRYPOINT ["/app/run_kubemon.sh"]
