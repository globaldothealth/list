const { workerData } = require('worker_threads');
const axios = require('axios');
// make the request to the data service
try {
    axios({
        method: 'post',
        url: workerData.url,
        data: {
            query: workerData.query,
        },
        responseType: 'stream',
    }).then((response) => {
        // send the email using SES
        console.log(`got data for query ${workerData.query} for user ${workerData.email}`);
    });
} catch (err) {
    console.error(err);
    throw err; // err is available in the main process
}
