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
1. edit `../scripts/export-data/functions/02-export/fields.txt`
2. Generate the CSV fields list
   `pushd ../scripts/prepare_fields_list; npm run populate-fields; popd`
3. re-build the data service (`npm run dev` watches the source so will do this automatically)
