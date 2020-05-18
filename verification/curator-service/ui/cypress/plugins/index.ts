// Need to use require in plugins file 
// https://stackoverflow.com/questions/59743577/is-there-anyway-to-query-mongodb-in-cypress-test
const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

module.exports = (on: any, config: any) => {
  on('task', {
    clearDB() {
      return new Promise((resolve) => {
        MongoClient.connect(url, function (error, db) {
          if (error) throw error;
          const covid19db = db.db("covid19");
          covid19db.collection('cases').remove({});
        });
        resolve(null);
      });
    }
  })
}