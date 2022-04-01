const indexes = [
  {
      name: 'tokensTTL',
      key: {
        'createdAt': 1
      },
      expireAfterSeconds: 3600,
  },
];
module.exports = {
  async up(db, client) {
      await db.command({
          createIndexes: 'tokens',
          indexes: indexes,
      });
  },

  async down(db, client) {
      await db.command({
          dropIndexes: 'tokens',
          index: ['tokensTTL'],
      });
  },
};