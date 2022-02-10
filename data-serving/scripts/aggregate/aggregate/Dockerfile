FROM python:3.10
ENV PIP_DISABLE_PIP_VERSION_CHECK=on
RUN pip install poetry
WORKDIR /app
COPY poetry.lock pyproject.toml /app/
RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-dev
COPY app.py geocoding_countries.json /app/
ENTRYPOINT ["/app/app.py"]
