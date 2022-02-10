/**
 * This script patches up the confirmation dates after we found that the migration
 * data-serving/scripts/setup-db/migrations/20211109102327-denormalise-confirmation-date-1875.js
 * takes far too long to complete (like months with ~70M case records) in MongoDB Atlas.
 * 
 * Run it on a collection with existing data after migrating up the above migration.
 */

var sourceCollection = db.getSiblingDB("covid19").getCollection("cases");
var flush = 10000; // force bulk execution after this many documents have queued for update
var filter = { confirmationDate: { $exists: false } };
var batch = sourceCollection.initializeUnorderedBulkOp();
var count = sourceCollection.find(filter).count();
var prog = 0;
print("Processing " + count + " documents");
sourceCollection.find(filter, { _id: 1, events: 1 }).batchSize(1000).forEach(function(doc) {
  prog++;
  doc.events.forEach(function(anEvent) {
    if (anEvent.name === 'confirmed') {
      const confirmationDate = anEvent.dateRange.start;
      batch.find({ _id: doc._id }).updateOne({ $set: { confirmationDate } });
      return;
    }
  });
  
  if (prog % flush == 0) {
    print(new Date() + " - Processing " + prog + " of " + count);
    batch.execute();    
    batch = sourceCollection.initializeUnorderedBulkOp();
  }
});
print(new Date() + " - Processing " + prog + " of " + count);
batch.execute();
print(new Date() + "Done");