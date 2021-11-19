const indexes = [
  {
    name: 'ageStartAndCreationDateListed',
    key: {
      'list': 1,
      'demographics.ageRange.start': -1,
      'revisionMetadata.creationMetadata.date': -1,
    },
  },
  {
    name: 'countryAndCreationDateListed',
    key: {
      'list': 1,
      'location.country': 1,
      'revisionMetadata.creationMetadata.date': -1,
    },
     collation: {
      locale: 'en_US',
      strength: 2,
    },
  },
  {
    name: 'variantAndCreationDateListed',
    key: {
      'list': 1,
      'variant.name': -1,
      'revisionMetadata.creationMetadata.date': -1,
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
      index: ['ageStartAndCreationDateListed','countryAndCreationDateListed', 'variantAndCreationDateListed']
    });
  }
};
