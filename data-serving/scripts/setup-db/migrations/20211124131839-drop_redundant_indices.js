const indexes = [
  {
    "name": "sourceIdIdx",
    "key": {
        "caseReference.sourceId": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "uploadIdsIdx",
    "key": {
        "caseReference.uploadIds": -1
    },
    "partialFilterExpression": {
        "caseReference.uploadIds.0": {
            "$exists": true
        }
    }
  },
  {
    "name": "eventNamesIdx",
    "key": {
        "events.name": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "travelHistoryCountriesIdx",
    "key": {
        "travelHistory.travel.location.country": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "demographicsGenderIdx",
    "key": {
        "demographics.gender": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "demographicsOccupationIdx",
    "key": {
        "demographics.occupation": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "demographicsNationalitiesIdx",
    "key": {
        "demographics.nationalities": -1
    },
    "partialFilterExpression": {
        "demographics.nationalities.0": {
            "$exists": true
        }
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "demographicsEthnicityIdx",
    "key": {
        "demographics.ethnicity": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "locationAdmin1Idx",
    "key": {
        "location.administrativeAreaLevel1": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "locationQueryIdx",
    "key": {
        "location.query": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "locationAdmin2Idx",
    "key": {
        "location.administrativeAreaLevel2": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "locationAdmin3Idx",
    "key": {
        "location.administrativeAreaLevel3": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "pathogenIdx",
    "key": {
        "pathogen.name": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "caseReferenceCreationMetadataCuratorIdx",
    "key": {
        "caseReference.creationMetadata.curator": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "caseReferenceUpdateMetadataCuratorIdx",
    "key": {
        "caseReference.updateMetadata.curator": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "caseReferenceSourceUrlIdx",
    "key": {
        "caseReference.sourceUrl": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "caseReferenceVerificationStatusIdx",
    "key": {
        "caseReference.verificationStatus": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "revisionMetadataCreationMetadataDate",
    "key": {
        "revisionMetadata.creationMetadata.date": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "eventCaseCreationDate",
    "key": {
        "events.dateRange.start": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  },
  {
    "name": "ageIdx",
    "key": {
        "demographics.ageRange.start": -1
    },
    "collation": {
        "locale": "en_US",
        "strength": 2
    }
  }

];

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
