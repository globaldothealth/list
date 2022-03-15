const indexes = [
  {
    name: 'locationCountry',
    key: {
        'location.country': -1,
    },
    collation: {
        locale: 'en_US',
        strength: 2,
    },
  },
  {
    name: 'travelHistoryCountry',
    key: {
        'travelHistory.travel.location.country': -1,
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
          index: ['locationCountry', 'travelHistoryCountry'],
      });
  },
};
