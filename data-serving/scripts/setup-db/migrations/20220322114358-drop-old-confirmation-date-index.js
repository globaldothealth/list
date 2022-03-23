const indexes = [
  {
    name: 'byConfirmationDateIfListed',
      key: {
          list: -1,          
          confirmationDate: -1,
      },
      collation: {
          locale: 'en_US',
          strength: 2,
      },
  }
]

module.exports = {
  async up(db, client) {
    await db.command({
      dropIndexes: 'cases',
      index: indexes.map((anIndex) => anIndex.name),
    });
  },

  async down(db, client) {
    await db.command({
      createIndexes: 'cases',
      indexes: indexes,
    });
  }
};
