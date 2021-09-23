const indexes = [
  {
    name: 'sourceAndVerificationStatus',
    key: {
      'caseReference.sourceId': 1,
      'caseReference.verificationStatus': 1,
    },
    collation: {
      locale: 'en_US',
      strength: 2,
    },
  },
  {
    name: 'byDateIfListed',
    key: {
      'list': 1,
      'revisionMetadata.creationMetadata.date': -1,
    },
  },
  {
    name: 'sourceAndUploadId',
    key: {
      'caseReference.sourceId': 1,
      'caseReference.uploadIds': 1,
    },
  },
  {
    name: 'bySourceIfListed',
    key: {
      'caseReference.sourceId': 1,
      'list': 1,
    }
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
      index: ['sourceAndVerificationStatus', 'byDateIfListed', 'sourceAndUploadId', 'bySourceIfListed']
    });
  }
};
