/*
 * We need to ensure that ages are bucketed within five-year brackets, except for infants (below 1 year)
 * to improve the protection against deanonymisation in the case database. A previous migration introduced an
 * ageBuckets collection which represents an enumeration of the age ranges 0, 1-5, 6-10, 11-15, ..., 116-120.
 * 
 * This one removes the now-redundant and inaccurate demographics.ageRange property from the cases collection.
 * The only information that defines the age for the case should be the buckets.
 */

const ageRangeSchema ={
  "bsonType": "object",
  "additionalProperties": false,
  "properties": {
    "start": {
      "bsonType": "number",
      "minimum": 0,
      "maximum": 120
    },
    "end": {
      "bsonType": "number",
      "minimum": 0,
      "maximum": 120
    }
  }
};

module.exports = {
  async up(db, client) {
    let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    delete schema.properties.demographics.properties.ageRange;
    await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );
  },

  async down(db, client) {
    let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.demographics.properties.ageRange = ageRangeSchema;
    await db.command( { collMod: 'cases', validator:{ $jsonSchema: schema } } );
  }
};
