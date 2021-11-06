const countryCodes = {
    bsonType: 'array',
    items: {
        bsonType: 'string'
    }
};

module.exports = {
  async up(db, client) {
      let res = await db.command({listCollections: undefined, filter: {name: 'sources'}});
      let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
      schema.properties.countryCodes = countryCodes;
      await db.command({ collMod: 'sources', validator:{ $jsonSchema: schema } } );
  },

  async down(db, client) {
      let res = await db.command({listCollections: undefined, filter: {name: 'sources'}});
      let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
      delete schema.properties.countryCodes;
      await db.command( { collMod: 'sources', validator:{ $jsonSchema: schema } } );
  }
};
