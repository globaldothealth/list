const fs = require('fs');

module.exports = {
  async up(db, client) {
    await createCollectionValidationAndIndexes(
      db,
      'cases',
      'schemas/cases.schema.json',
      'schemas/cases.indexes.json'
    );

    await createCollectionValidationAndIndexes(
      db,
      'sources',
      'schemas/sources.schema.json',
      'schemas/sources.indexes.json'
    );
  },

  async down(db, client) {
    // initial migration has no rollback
  }
};

async function createCollectionValidationAndIndexes(db, collectionName, schemaPath, indexPath) {
  const schemaFile = await fs.promises.readFile(schemaPath);
  const schema = JSON.parse(schemaFile);

  const indexFile = await fs.promises.readFile(indexPath);
  const indexes = JSON.parse(indexFile);
  /*
   * because this migration might run against a DB from before we had the migrations infra,
   * check whether the collection already exists. If it does, then modify its validation schema.
   * If it doesn't, then create it.
   */
  try {
    await db.collection(collectionName);
    await db.command({
      collMod: collectionName,
      validator: schema,
    });
  }
  catch {
    await db.createCollection(collectionName, {
      validator: schema,
    });
  }

  const collection = db.collection(collectionName);
  await collection.dropIndexes();

  await db.command({
    createIndexes: collectionName,
    indexes: indexes,
  });
}

