# Export data

This folder has scripts to export data using AWS Batch.

* **country_export.sh**: This is the main script which exports country data to
  a .csv.gz file.
* **setup_batch.sh**: This is used to setup AWS Batch job definitions, it only
  needs to be run once. It takes no parameters.
* **submit_job.sh**: Used to submit an export job to AWS Batch. This takes one
  parameter, the job name, which is of the form `exporter_<country>` where
  `<country>` is the name of the country in lowercase, with spaces replaced by
  underscores, and after removing periods, commas and apostrophes.
* **transform.py**: The data from mongoexport needs some transformations before
  writing to CSV. This script takes in CSV data from mongoexport and outputs
  CSV to standard output. The output from this program is valid export data and
  can be piped to compress and/or be uploaded to a server.
* **fields.txt**: List of fields that is passed to mongoexport.

The Dockerfile is deployed as an Amazon ECR image using GitHub Actions.

## Local invocation

The transform.py script can be run locally, it requires Python >= 3.9.

The docker image can be built locally. If you are not using a localhost
MongoDB, you must specify CONN as a
[MongoDB connection string](https://docs.mongodb.com/manual/reference/connection-string/)
during the build phase:

    CONN='<url>' docker build --build-arg CONN -t country-export

You will need write access to S3. Alternatively, you can setup localstack to
have a mock S3 environment. To run a hypothetical export for Antarctica:

    docker run -e 'COUNTRY=Antarctica' country-export

