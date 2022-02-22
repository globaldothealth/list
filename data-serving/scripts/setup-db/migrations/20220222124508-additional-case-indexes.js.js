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
    },
    {
        name: 'byCountryAndConfirmationDateIfListed',
        key: {
            list: -1,
            'location.country': -1,
            confirmationDate: -1,
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
                'byConfirmationDateIfListed',
                'byCountryAndConfirmationDateIfListed',
            ],
        });
    },
};
