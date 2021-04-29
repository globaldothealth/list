FROM python:3.8  

ENV EPID_INGESTION_ENV ""XXXXXXXXXXX""
ENV EPID_INGESTION_SOURCE_ID "XXXXXXXXXXX"


COPY requirements.txt /
RUN pip install  -r /requirements.txt

COPY . /app
WORKDIR /app

CMD [ "python", "./retrieval/retrieval.py" ]
