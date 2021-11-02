#!/bin/bash
# Full data export
# Depends: aws-cli

set -xeuo pipefail

# https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-retries.html#cli-usage-retries-configure
export AWS_MAX_ATTEMPTS=10

COUNTRY_EXPORT_BUCKET="s3://covid-19-country-export"
FULL_EXPORT_BUCKET="s3://covid-19-data-export"

# Unlike country_export.sh, here FORMAT only takes one value
# Multiple formats are exported using separate AWS Batch job definitions
FORMAT="${FORMAT:-csv}"
FILE="latestdata-$FORMAT.tar"
FILE_DATE="$(date '+%Y-%m-%d')-$FORMAT.tar"

DIR="$(mktemp -d)"
echo "Starting full export for format: $FORMAT"
echo "Made temporary directory $DIR"
trap "rm -rf $DIR" EXIT  # Cleanup before exit

cp data_dictionary.txt citation.txt "$DIR"

mkdir "$DIR/country"
echo "Downloading files from $COUNTRY_EXPORT_BUCKET..."
aws s3 sync $COUNTRY_EXPORT_BUCKET/$FORMAT/ "$DIR/country"
echo "Preparing tarball..."
tar cf $FILE -C "$DIR" .
echo "Uploading to $FULL_EXPORT_BUCKET..."
aws s3 cp $FILE $FULL_EXPORT_BUCKET/latest/$FILE
aws s3 cp $FULL_EXPORT_BUCKET/latest/$FILE $FULL_EXPORT_BUCKET/archive/$FILE_DATE
echo "Done!"
