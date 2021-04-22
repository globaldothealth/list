const { workerData } = require('worker_threads');
const axios = require('axios');
const AWS = require('aws-sdk');

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
            ReturnPath: workerData.sourceAddress,
            Source: workerData.sourceAddress,
        },(err, data) => {
            console.log(`sent email with correlation id ${workerData.correlationId}`);
            if (err)
            {
                console.error('error:');
                console.error(err);
            }
            if (data)
            {
                console.log(`response from Amazon:`);
                console.log(data);
            }
        });
    });
} catch (err) {
    console.error(err);
}
