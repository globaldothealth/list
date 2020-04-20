# Starting a dev server
1. Run a local MongoDB instance
   `mongod`
2. Run the local dataserver
   `npm run dev`

# Import data into local MongoDB instance
`mongoimport --db dev --collection covid19 --file data-serving/samples/line-list.json`
