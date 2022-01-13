/*
 * This script replaces country names with their two-character codes. Run this before the migration 20211222101904-iso-country-codes.js
 * (which imposes the validation constraint that country fields must be two characters long).
 */

var countries = require("i18n-iso-countries");

function countryNameToCode(country) {
    // specific hack to fix https://github.com/globaldothealth/list/issues/2221
    if (country === 'Algiers') {
        country = 'Algeria';
    }
    return countries.getAlpha2Code(country, 'en');
}

var sourceCollection = db.getSiblingDB("covid19").getCollection("cases");
var flush = 10000; // force bulk execution after this many documents have queued for update
var filter = { 'location.country': { $exists: true } };
var batch = sourceCollection.initializeUnorderedBulkOp();
var count = sourceCollection.find(filter).count();
var prog = 0;
print("Processing " + count + " documents");
sourceCollection.find(filter, { _id: 1, location: 1, travelHistory: 1 }).batchSize(1000).forEach(function(doc) {
  prog++;
  const country = countryNameToCode(doc.location.country);
  batch.find({ _id: doc._id }).updateOne({ $set: { location: { country }}});
  const travel = doc.travelHistory?.travel ?? null;
  if (travel) {
      const replacementTravel = travel.map(aTravel => {
          const newTravel = Object.assign({}, aTravel);
          if (newTravel.location && newTravel.location.country) {
              newTravel.location.country = countryNameToCode(aTravel.location.country);
          }
      });
      batch.find({ _id: doc._id }).updateOne({ $set: { travelHistory: { travel: replacementTravel }}});
  }
  
  if (prog % flush == 0) {
    print(new Date() + " - Processing " + prog + " of " + count);
    batch.execute();    
    batch = sourceCollection.initializeUnorderedBulkOp();
  }
});
print(new Date() + " - Processing " + prog + " of " + count);
batch.execute();
print(new Date() + "Done");