const countryValidation = {
  bsonType: 'string',
  maxLength: 2,
  minLength: 2,
};

const oldCountryValidation = {
  bsonType: 'string',
}

module.exports = {
  async up(db, client) {
    const res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    const schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.location.properties.country = countryValidation;
    await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );
  },

  async down(db, client) {
    const sourceCollection = db.collection("cases");
    const res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    const schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.location.properties.country = oldCountryValidation;
    await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );
  }
};
