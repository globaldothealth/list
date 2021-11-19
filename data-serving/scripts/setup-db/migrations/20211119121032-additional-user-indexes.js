const indexes = [
  {
    name: 'googleID',
    key: {
      googleID: 1,
    },
  },
]

module.exports = {
  async up(db, client) {
    await db.command({
      createIndexes: 'users',
      indexes: indexes,
    });
  },

  async down(db, client) {
    await db.command({
      dropIndexes: 'users',
      index: ['googleID'],
    });
  }
};
