const indexes = [
    {
        name: 'byCountryAdmin1Admin2Admin3IfListed',
        key: {
            list: -1,
            'location.country': -1,
            'location.administrativeAreaLevel1': -1,
            'location.administrativeAreaLevel2': -1,
            'location.administrativeAreaLevel3': -1,
        },
        collation: {
            locale: 'en_US',
            strength: 2,
        },
    },
    {
        name: 'byCountryAdmin2Admin3IfListed',
        key: {
            list: -1,
            'location.country': -1,
            'location.administrativeAreaLevel2': -1,
            'location.administrativeAreaLevel3': -1,
        },
        collation: {
            locale: 'en_US',
            strength: 2,
        },
    },
    {
        name: 'byCountryAdmin1Admin3IfListed',
        key: {
            list: -1,
            'location.country': -1,
            'location.administrativeAreaLevel1': -1,
            'location.administrativeAreaLevel3': -1,
        },
        collation: {
            locale: 'en_US',
            strength: 2,
        },
    },
    {
        name: 'byCountryAdmin3IfListed',
        key: {
            list: -1,
            'location.country': -1,
            'location.administrativeAreaLevel3': -1,
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
            index: [
                'byCountryAdmin1Admin2Admin3IfListed',
                'byCountryAdmin2Admin3IfListed',
                'byCountryAdmin1Admin3IfListed',
                'byCountryAdmin3IfListed',
            ],
        });
    },
};
