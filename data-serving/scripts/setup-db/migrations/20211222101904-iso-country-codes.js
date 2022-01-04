var countries = require("i18n-iso-countries");

const countryValidation = {
  bsonType: 'string',
  maxLength: 2,
  minLength: 2,
};

const oldCountryValidation = {
  bsonType: 'string',
}

function countryNameToCode(country) {
  return countries.getAlpha2Code(country, 'en');
}

function countryCodeToName(country) {
  return countries.getName(country, 'en');
}

async function replaceCountryValues(sourceCollection, transform) {
  const filter = { 'location.country': { $exists: true } };
  const count = await sourceCollection.find(filter).count();
  if (count != 0) /* required for migrating up new database */ {
    const foundDocuments = await sourceCollection.find(filter, { _id: 1, location: 1, travelHistory: 1 });
    await foundDocuments.forEach(async function(doc) {
      const country = transform(doc.location.country);
      let update = {};
      if (country) {
        update.location = {
          country,
        };
      } else {
        console.log(`Can't find transformation for ${doc.location.country}`);
      }
      if (doc.travelHistory && doc.travelHistory.travel) {
        const travel = doc.travelHistory.travel.map(function (aTravel) {
          let newTravel = Object.assign({}, aTravel);
          const country = transform(aTravel.location.country);
          if (country) {
            newTravel.location.country = country;
          }
          else {
            console.log(`Can't find transformation for ${aTravel.location.country}`);
          }
          return newTravel;
        });
        update.travelHistory = { 
          travel,
          traveledPrior30Days: doc.travelHistory.traveledPrior30Days,
        };
      }
      await sourceCollection.updateOne({ _id: doc._id }, { $set: update });
      
    });
  }
}

module.exports = {
  async up(db, client) {
    // replace all locations.country values with ISO-3166-1 Alpha-2 codes
    // and travelHistory.travel.i.location.country
    const sourceCollection = db.collection("cases");
    await replaceCountryValues(sourceCollection, countryNameToCode);
    // amend validation so that country must be two characters long, if set
    const res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    const schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.location.properties.country = countryValidation;
    await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );
  },

  async down(db, client) {
    /* this rollback is lossy, in that the "country name"->"country codes" function is non-injective.
     * For example, the "up" function will have replaced both "People's Republic of China" and "China"
     * with "cn", but here all cases with country "cn" will acquire the same value.
     */

    // start by undoing the length restriction on country
    const sourceCollection = db.collection("cases");
    const res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    const schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.location.properties.country = oldCountryValidation;
    await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );

    // now rewrite the country values with their names
    await replaceCountryValues(sourceCollection, countryCodeToName);
  }
};
