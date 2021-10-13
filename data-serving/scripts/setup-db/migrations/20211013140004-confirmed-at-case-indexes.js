const indexes = [
  {
    name: 'countryAndConfirmedAtIdx',
    key: {
      'location.country': -1,
      'events.dateRange.start': -1
    },
    collation: {
      locale: 'en_US',
      strength: 2
    }
  },
  {
    name: 'uploadIdAndConfirmedAtIdx',
    key: {
      'caseReference.uploadIds': -1,
      'events.dateRange.start': -1
    },
    partialFilterExpression: {
      'caseReference.uploadIds.0': {
          $exists: true
      }
    },
    collation: {
      locale: 'en_US',
      strength: 2
    }
  }
]

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
      index: ['countryAndConfirmedAtIdx', 'uploadIdAndConfirmedAtIdx']
    });
  }
};
