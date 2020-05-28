// Need to use require in plugins file
// https://stackoverflow.com/questions/59743577/is-there-anyway-to-query-mongodb-in-cypress-test
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/';

module.exports = (on: any, config: any) => {
    on('task', {
        clearDB() {
            return new Promise((resolve, reject) => {
                MongoClient.connect(
                    url,
                    { useUnifiedTopology: true },
                    async (error, db) => {
                        if (error) reject(error);
                        const covid19db = db.db('covid19');
                        await covid19db.collection('cases').deleteMany({});
                        db.close();
                        resolve(null);
                    },
                );
            });
        },
    });
};
