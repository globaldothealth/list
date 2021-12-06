const SGTF = {
    bsonType: 'int',
};

module.exports = {
  async up(db, client) {
      let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
      let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
      schema.properties.SGTF = SGTF;
      await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );
  },

  async down(db, client) {
      let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
      let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
      delete schema.properties.SGTF;
      await db.command( { collMod: 'cases', validator:{ $jsonSchema: schema } } );
  }
};
