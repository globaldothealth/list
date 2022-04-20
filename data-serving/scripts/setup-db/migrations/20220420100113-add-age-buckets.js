/*
 * We need to ensure that ages are bucketed within five-year brackets, except for infants (below 1 year)
 * to improve the protection against deanonymisation in the case database. In this migration I create an
 * ageBuckets collection which represents an enumeration of the age ranges 0, 1-5, 6-10, 11-15, ..., 116-120.
 * 
 * I also allow the cases collection documents to have an array of unique objectIDs in the 'demographics.ageBuckets'
 * property. That means that each case can link to zero or more elements in the enumeration. Here are some examples of
 * how that will work:
 * 
 * case has no age specified: ageBuckets = []
 * case has exact age 18: ageBuckets = [(16-20)._id]
 * case has range 18-24: ageBuckets = [(16-20)._id, (21-25)._id]
 */

const ageBucketSchema = {
  bsonType: 'array',
  uniqueItems: true,
  items: {
    bsonType: "objectId",
  }
};

module.exports = {
  async up(db, client) {
    await db.createCollection("ageBuckets", {
      validator: {
        $jsonSchema: {
          "bsonType": "object",
          "additionalProperties": false,
          "required": ["start", "end"],
          "properties": {
            "_id": {
              "bsonType": "objectId",
            },
            "start": {
              "bsonType": "number",
              "minimum": 0,
              "maximum": 116
            },
            "end": {
              "bsonType": "number",
              "minimum": 0,
              "maximum": 120
            }
          }
        }
      }
    });

    const ageBuckets = db.collection('ageBuckets');
    await ageBuckets.insertOne({
      start: 0,
      end: 0,
    });
    for(let start = 1; start <= 116; start += 5) {
      const end = start + 4;
      await ageBuckets.insertOne({
        start,
        end,
      });
    }

    let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.demographics.properties.ageBuckets = ageBucketSchema;
    await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );
  },

  async down(db, client) {
    let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    delete schema.properties.demographics.properties.ageBuckets;
    await db.command( { collMod: 'cases', validator:{ $jsonSchema: schema } } );

    await db.collection('ageBuckets').drop();
  }
};
