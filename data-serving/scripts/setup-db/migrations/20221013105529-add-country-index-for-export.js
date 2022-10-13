// index used by mongoexport in export-data scripts

const indexes = [
  {
      name: 'byCountryIfListed',
      key: {
          'location.country': 1,
          list: 1,          
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
          index: ['byCountryIfListed'],
      });
  },
};
