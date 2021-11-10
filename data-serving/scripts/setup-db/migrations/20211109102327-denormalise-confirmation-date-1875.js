const confirmationDate = {
  bsonType: "date",
};

module.exports = {
  async up(db, client) {
    let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    schema.properties.confirmationDate = confirmationDate;
    await db.command({ collMod: 'cases', validator:{ $jsonSchema: schema } } );

    // now amend the existing cases. This must be done one by one so will take a lot of time!
    const collection = db.collection('cases');
    collection.find({}).forEach(function(err, doc) {
      if(!doc) {
        console.error(`error ${err} migrating confirmation date on doc ${doc?._id ?? ''}`);
        // continue as subsequent case modifications may still work
        return;
      }
      doc.events.forEach((anEvent) => {
        if (anEvent.name === 'confirmed') {
          const confirmationDate = anEvent.dateRange.start;
          collection.updateOne({ _id: doc._id }, { confirmationDate });
          return;
        }
      });
    });
  },

  async down(db, client) {
    let res = await db.command({listCollections: undefined, filter: {name: 'cases'}});
    let schema = res.cursor.firstBatch[0].options.validator.$jsonSchema;
    delete schema.properties.confirmationDate;
    await db.command( { collMod: 'cases', validator:{ $jsonSchema: schema } } );

    const collection = db.collection('cases');
    collection.updateMany({}, {$unset: {"confirmationDate":1}});
  }
};
