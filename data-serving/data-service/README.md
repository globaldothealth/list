# Starting a dev server
1. Run a local MongoDB instance
   `mongod`
2. Run the local dataserver
   `npm run dev`

# Import data into local MongoDB instance
From the data-service root, run:
`npm run import-data`

(You may want to optionally `npm run drop-cases` first to remove any stale data: beware doing this in production!)

# Update the fields used in CSV export
1. edit `../scripts/export-data/fields.txt`
2. Generate the CSV fields list
   `pushd ../scripts/prepare_fields_list; npm run populate-fields; popd`
3. re-build the data service (`npm run dev` watches the source so will do this automatically)

# Age bucketing

To prevent reidentification of individual cases, we use bucketed age ranges for infants (<1 year old) and then five year ranges.
This bucketing is done in the data service: age ranges are converted to age buckets when you write through the API (PUT/POST/upsert/batchUpsert),
then the bucketed age range is returned in API requests (GET or download).

This could have been done using mongoose hooks but we don't want to rely on mongoose for much longer (already removed from the curator service),
so instead all transformations are done by the cases controller.
