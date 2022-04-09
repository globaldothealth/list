const indexes = [
  {
      name: 'byCuratorEmailIfListed',
      key: {
          list: -1,          
          'revisionMetadata.creationMetadata.curator': -1,
      },
      collation: {
          locale: 'en_US',
          strength: 2,
      },
  },
];
module.exports = {
  async up(db, client) {
      await db.command({
          createIndexes: 'cases',
          indexes: indexes,
      });
  },

  async down(db, client) {
      await db.command({
          dropIndexes: 'cases',
          index: ['byCuratorEmailIfListed'],
      });
  },
};