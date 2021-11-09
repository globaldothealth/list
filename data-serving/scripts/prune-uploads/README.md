# prune uploads

This is a script that should be run periodically that sets every upload older
than the last acceptable upload to *list = false* (for non-UUID sources). For
UUID sources, set everything to list = true. After marking, this deletes
everything with *list = false*.

Configuration is via environment variables or via command line arguments.
When both are specified, the command line arguments take precedence.

This script is usually run automatically on a schedule every day using GitHub Actions.

## Invocation

First, set up a virtual environment and install the dependencies

    python3 -m venv venv
    source venv/bin/activate
    python -m pip install -r requirements.txt

Now we can run the script. We can use `--help` to see the available arguments:

    python prune_uploads.py --help

To dry-run the script for all sources that have ingestion set up, set the environment
variable CONN to the MongoDB server URL

    export CONN=<mongodb server url>
    python prune_uploads.py -n

Remove the -n to actually prune uploads.

## Parameters

* **CONN** (**required**): A valid
   [MongoDB connection string](https://docs.mongodb.com/manual/reference/connection-string/).

* **PRUNE_EPOCH** | **-e** *date*, **--epoch**=*date*:
  Specified as a YYYY-MM-DD *date*, this tells prune-uploads to ignore all
  uploads before this date. This is primarily useful for denoting the date when
  prune-uploads was switched on and non-UUID sources have started ingesting in
  full. Prior to this date, we can not assume that non-UUID sources are
  undergoing full ingestions, which would break the logic that prune-uploads
  uses of a successful ingestion only comprising one upload ID.

  This does not affect UUID sources which retain the same behaviour as before,
  i.e. all uploads are valid and should be kept in the line list

* **PRUNE_ERROR_THRESHOLD_PERCENT** |
  **-t** *threshold*, **--threshold**=*threshold* (default=10):
  Specified as an integer, this parameter defines the upper threshold of errors
  as a percentage that is acceptable when ingesting a non-UUID source. Uploads
  not meeting this threshold will be rejected. Default error threshold is 10%.

  This does not affect UUID sources.

* **PRUNE_UPLOADS_WEBHOOK_URL**: The URL that is used to send notifications
  via a POST with {text: *prune uploads output*} JSON data. You can get webhook URLs
  on Slack by enabling [incoming webhooks](https://api.slack.com/messaging/webhooks).

* **-s** *sourceId*, **--source**=*sourceId*:
  Run prune-uploads for the given *sourceId* only.
  Default is to run on all sources that have an ingestion set up.

* **-n**, **--dry-run**: Dry run, do not change the database

* **-d**, **--allow-decrease**: Allow cases to decrease in ingestion for non-UUID
  uploads. By default, non-UUID uploads are only accepted if they increase the number
  of cases. This option has no effect on UUID source uploads, which are always
  ingested.

* **-r**, **--run-hooks**=*hook1*[,*hook2*]: Runs hooks after prune finishes. Specify
  *all* to run all hooks configured to run.

* **--env** (default=prod): Specifies which environment to use. This is passed to hooks
  which can vary behaviour based on this, as with the country export script.

## How it works

Prune uploads uses the *uploads* array in the sources collection to get a list
of uploads. It then removes all uploads that it has previously accepted or
rejected, by checking the *accepted* field for an upload. This field is visible
as the Accepted? column in the uploads UI for curators.

Then for

* **non-UUID** sources: Finds the last successful upload that meets the error
  threshold and epoch criteria, then marks all other uploads that are not in
  progress to be rejected
* **UUID** sources: Marks all uploads that are not in progress

After this, prune-uploads marks line list cases as *list = true* (*list = false*) for
accepted (rejected) uploads, and updates the uploads array in the sources collection to
indicate that these uploads have been processed, by setting the *accepted* attribute.

## Hooks

Following ingestion, prune-uploads runs the following hooks:

**country-export**: Each ingested source has a corresponding list of [two
letter ISO 3166-1 country
codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2). A map to country
names is used to construct the corresponding `exporter_*` job definitions (as
an example: US would map to `exporter_united_states`). These job definitions
export country-specific data to an S3 bucket. This hook submits jobs to the
`export-queue` jom queue, triggering the country export process for the sources
it just ingested.
