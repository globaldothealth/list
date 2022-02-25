const originalOriginSchema = {
  "bsonType": "object",
  "required": ["url"],
  "properties": {
    "url": {
      "bsonType": "string"
    },
    "license": {
      "bsonType": "string"
    }
  }
}

const newOriginSchema = {
  "bsonType": "object",
  "required": ["license", "url"],
  "properties": {
    "url": {
      "bsonType": "string"
    },
    "license": {
      "bsonType": "string"
    },
    "providerName": {
      "bsonType": "string"
    },
    "providerWebsiteUrl": {
      "bsonType": "string"
    }
  }
}

module.exports = {
  async up(db, client) {
    let res = await db.command({listCollections: undefined, filter: {name: 'sources'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.origin = newOriginSchema;
    await db.command({ collMod: 'sources', validator:{ $jsonSchema: schema } } );
},

  async down(db, client) {
    let res = await db.command({listCollections: undefined, filter: {name: 'sources'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.origin = originalOriginSchema;
    await db.command({ collMod: 'sources', validator:{ $jsonSchema: schema } } );
  }
};
