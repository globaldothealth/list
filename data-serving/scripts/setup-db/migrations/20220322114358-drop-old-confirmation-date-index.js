module.exports = {
  async up(db, client) {
    await db.command({
      dropIndexes: 'cases',
      index: 'byConfirmationDateIfListed',
    });
  },

  async down(db, client) {
    await db.command({
      createIndexes: 'cases',
      indexes: indexes,
    });
  }
};
