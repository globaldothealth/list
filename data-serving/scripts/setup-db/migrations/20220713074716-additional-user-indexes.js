const indexes = [
    {
        name: 'email',
        key: {
            email: 1,
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
            createIndexes: 'users',
            indexes: indexes,
        });
    },

    async down(db, client) {
        await db.command({
            dropIndexes: 'users',
            index: ['email'],
        });
    },
};
