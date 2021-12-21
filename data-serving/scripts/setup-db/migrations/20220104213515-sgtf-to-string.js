const stringSGTF = {
    bsonType: 'string',
};

const intSGTF = {
    bsonType: 'int',
};

module.exports = {
  async up(db, client) {
      let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
      let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
      schema.properties.SGTF = stringSGTF;
      await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );
  },

  async down(db, client) {
      let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
      let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
      schema.properties.SGTF = intSGTF;
      await db.command( { collMod: 'cases', validator:{ $jsonSchema: schema } } );
  }
};