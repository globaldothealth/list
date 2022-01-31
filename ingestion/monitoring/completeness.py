import os
import sys
import json
import tempfile
import logging
import contextlib
from pathlib import Path

import boto3
import pandas as pd


def data_files(bucket, prefix="csv", suffix=".csv.gz", endpoint_url=None):
    try:
        bucket = boto3.resource("s3", endpoint_url=endpoint_url).Bucket(bucket)
    except Exception as e:
        logging.error(f"Failed to access bucket={bucket} with exception {e}")
    return [
        file
        for file in bucket.objects.all()
        if file.key.startswith(prefix) and file.key.endswith(suffix)
    ]


def non_null(df):
    counts = {"N": df.shape[0]}
    counts.update(
        {field: df.loc[pd.notnull(df[field])].shape[0] for field in df.columns}
    )
    return pd.Series(counts)


def completeness_file(filename, chunksize=100000):
    it = pd.read_csv(
        filename, compression="gzip", iterator=True, dtype=str, chunksize=chunksize
    )
    _chunks = []
    with contextlib.suppress(StopIteration):
        while not (chunk := it.get_chunk()).empty:
            _chunks.append(non_null(chunk))
    completeness = pd.DataFrame(_chunks).sum()
    completeness = dict(100 * completeness / completeness.N)
    del completeness["N"]  # not needed, always 100
    return completeness


def completeness_s3(s3_object, endpoint_url=None):
    """Returns completeness of various fields in country

    s3_object should refer to a file in csv.gz format
    """
    bucket = boto3.resource("s3", endpoint_url=endpoint_url).Bucket(
        s3_object.bucket_name
    )
    with tempfile.NamedTemporaryFile() as tmp:
        logging.info(f"Downloading {s3_object.key} from {bucket}")
        try:
            bucket.download_file(s3_object.key, tmp.name)
        except Exception as e:
            logging.error(f"Failed to download with exception {e}")
            return None
        logging.info(f"Calculating completeness for {s3_object.key}")
        return completeness_file(tmp.name)


def upload(data, bucket, endpoint_url=None):
    logging.info(f"Uploading data to {bucket}")
    s3 = boto3.client("s3", endpoint_url=endpoint_url)
    try:
        s3.put_object(
            ACL="public-read",
            Body=json.dumps(data, indent=2, sort_keys=True),
            Bucket=bucket,
            Key="metrics/completeness.json",
        )
    except Exception as e:
        logging.error(f"Failed to upload with exception:\n{e}")


def completeness_s3_many(objects, endpoint_url=None):
    return {
        Path(obj.key).stem.split(".")[0]: completeness_s3(obj, endpoint_url)
        for obj in objects
    }


def setup_logger():
    h = logging.StreamHandler(sys.stdout)
    rootLogger = logging.getLogger()
    rootLogger.addHandler(h)
    rootLogger.setLevel(logging.INFO)


if __name__ == "__main__":
    setup_logger()
    endpoint_url = os.getenv("ENDPOINT_URL")
    objects = data_files(
        os.getenv("COUNTRY_EXPORT_BUCKET", "covid-19-country-export"),
        endpoint_url=endpoint_url,
    )
    data = completeness_s3_many(objects, endpoint_url)
    upload(data, os.getenv("METRICS_BUCKET", "covid-19-aggregates"), endpoint_url)
