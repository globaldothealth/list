const { workerData } = require('worker_threads');
const axios = require('axios');
const AWS = require('aws-sdk');

// make the request to the data service
try {
    console.error('workerData');
    console.error(workerData);
    axios({
        method: 'post',
        url: workerData.url,
        data: {
            query: workerData.query,
        },
        responseType: 'stream',
    }).then((response) => {
        // send the email using SES
        AWS.config.update({
            accessKeyId: workerData.accessKeyId,
            secretAccessKey: workerData.secretKey,
            region: workerData.region,
        });
        const ses = new AWS.SES({apiVersion: '2010-12-01'});
        ses.sendEmail({
            Destination: {
                ToAddresses: [workerData.email],
            },
            Message: {
                Body: {
                    Text: {
                        Charset: 'UTF-8',
                        Data: 'Here is your global.health download',
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Greetings from global.health',
                },
            },
            ReturnPath: 'downloads@global.health',
            Source: 'downloads@global.health',
        },(err, data) => {
            if (err)
            {
                console.error(err);
            }
            console.log(`sent email for query ${workerData.query} for user ${workerData.email}`);
            console.log(`response from Amazon: ${data}`);
        });
    });
} catch (err) {
    console.error(err);
}
