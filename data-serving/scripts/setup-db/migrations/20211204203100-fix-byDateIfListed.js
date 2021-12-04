const createIndexes = [
  {
    name: 'byDateIfListedCollated',
    key: {
      'list': 1,
      'revisionMetadata.creationMetadata.date': -1,
    },
    collation: {
      locale: 'en_US',
      strength: 2,
    },
  },
];

const dropIndexes = [
  {
    name: 'byDateIfListed',
    key: {
      'list': 1,
      'revisionMetadata.creationMetadata.date': -1,
    },
  },
];



module.exports = {
  async up(db, client) {
    await db.command({
      createIndexes: 'cases',
      indexes: createIndexes,
    });
    await db.command({
      dropIndexes: 'cases',
      index: ['byDateIfListed']
    });
  },
  async down(db, client) {
    await db.command({
      createIndexes: 'cases',
      indexes: dropIndexes,
    });
    await db.command({
      dropIndexes: 'cases',
      index: ['byDateIfListedCollated']
    });
  }
};
