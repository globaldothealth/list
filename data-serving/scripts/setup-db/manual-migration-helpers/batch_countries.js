/*
 * This script replaces country names with their two-character codes. Run this before the migration 20211222101904-iso-country-codes.js
 * (which imposes the validation constraint that country fields must be two characters long).
 */

var countries = require("i18n-iso-countries");

function countryNameToCode(country) {
    const specialCases = {
        // not present at all in the upstram library
        'Macau': 'MO',
        // Netherlands Antilles hasn't existed since 2010 so code to Carribean Netherlands
        'Netherlands Antilles': 'BQ',
    };
    if (country in specialCases) {
        return specialCases[country];
    }
    const namesToFix = {
        // specific hack to fix https://github.com/globaldothealth/list/issues/2221
        'Algiers': 'Algeria',
        /* specific workarounds to match names in the coding library.
         * 
         * I have a PR at https://github.com/michaelwittig/node-i18n-iso-countries/pull/277
         * but will belt-and-braces this to continue with the import.
         */
        'The Gambia': 'Gambia',
        'Tanzania': 'Tanzania, United Republic of',
        'Democratic Republic of the Congo': 'Congo',
        "People's Republic of China": 'China',
        'Macedonia [FYROM]': 'The Republic of North Macedonia',
        'Swaziland': 'Eswatini',
        'Moldova': 'Moldova, Republic of',
        "Côte d'Ivoire": "Cote d'Ivoire",
        'British Virgin Islands': 'Virgin Islands, British',
        'Falkland Islands [Islas Malvinas]': 'Falkland Islands (Malvinas)',
        'Réunion': 'Reunion',
        'Syria': 'Syrian Arab Republic',
        'Brunei': 'Brunei Darussalam',
        'U.S. Virgin Islands': 'Virgin Islands, U.S.',
    };

    if (country in namesToFix) {
        country = namesToFix[country];
    }
    const code = countries.getAlpha2Code(country, 'en');
    if (!code) {
        print(`${country} was not recognised, skipping!`);
    }
    return code;
}

var sourceCollection = db.getSiblingDB("covid19").getCollection("cases");
var flush = 10000; // force bulk execution after this many documents have queued for update
var filter = { 'location.country': { $exists: true } };
var batch = sourceCollection.initializeUnorderedBulkOp();
var count = sourceCollection.find(filter).count();
var prog = 0;
var applied = 0;
print("Processing " + count + " documents");
sourceCollection.find(filter, { _id: 1, location: 1, travelHistory: 1 }).batchSize(1000).forEach(function(doc) {
  prog++;
  if (doc.location.country.length !== 2) {
    const country = countryNameToCode(doc.location.country);
    if (country) {
        applied++;
        batch.find({ _id: doc._id }).updateOne({ $set: { 'location.country' : country }});
    }
  }
  const travel = doc.travelHistory?.travel ?? null;
  if (travel) {
    travel.forEach((aTravel, i) => {
        if (aTravel.location?.country && aTravel.location?.country.length !== 2) {
            const key = `travelHistory.travel.${i}.location.country`;
            const code = countryNameToCode(aTravel.location.country);
            if (code) {
                applied++;
                batch.find({ _id: doc._id }).updateOne({ $set: { [key]: code}});
            }
        }
    });
  }
  
  if (prog % flush == 0) {
    print(new Date() + " - Processing " + prog + " of " + count);
    if (applied > 0) {
        applied = 0;
        try {
            batch.execute();    
        } catch(e) {
            print(e);
            throw e;
        }
        batch = sourceCollection.initializeUnorderedBulkOp();
    }
  }
});
print(new Date() + " - Processing " + prog + " of " + count);
if (applied !== 0) {
    batch.execute();
}
print(new Date() + "Done");