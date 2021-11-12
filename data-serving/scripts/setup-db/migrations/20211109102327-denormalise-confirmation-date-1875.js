const confirmationDate = {
  bsonType: "date",
};

const indexes = [
  {
    name: 'byConfirmationDateIfListed',
    key: {
      'confirmationDate': 1,
      'list': 1,
    }
  },
];

module.exports = {
  async up(db, client) {
    let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.confirmationDate = confirmationDate;
    await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );

    // now amend the existing cases. This must be done one by one so will take a lot of time!
    const collection = db.collection('cases');
    collection.find({}).forEach(function(doc) {
      doc.events.forEach((anEvent) => {
        if (anEvent.name === 'confirmed') {
          const confirmationDate = anEvent.dateRange.start;
          collection.updateOne({ _id: doc._id }, { $set: { confirmationDate } });
          return;
        }
      });
    });

    // and index the above
    await db.command({
      createIndexes: 'cases',
      indexes: indexes,
    });
  },

  async down(db, client) {
    await db.command({
      dropIndexes: 'cases',
      index: ['byConfirmationDateIfListed']
    });
    
    let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    delete schema.properties.confirmationDate;
    await db.command( { collMod: 'cases', validator:{ $jsonSchema: schema } } );

    const collection = db.collection('cases');
    collection.updateMany({}, {$unset: {"confirmationDate":1}});
  }
};
