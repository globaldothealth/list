/* eslint-disable */
const { workerData } = require('worker_threads');
const axios = require('axios');
const AWS = require('aws-sdk');
const pino = require('pino');
const JSZip = require('jszip');
const fs = require('fs');

const logger = pino({
    name: 'downloadAsyncWorker',
    prettyPrint: { colorize: false },
});

logger.info('Starting asynchronous download worker');
logger.info(`Requesting download for query ${workerData.query}`);

// make the request to the data service
try {
    axios({
        method: 'post',
        url: workerData.url,
        data: {
            query: workerData.query,
            format: workerData.format,
        },
        responseType: 'blob',
    }).then(async (response) => {
        let responseData;
        let contentType;

        if (workerData.format === 'json') {
            responseData = JSON.stringify(response.data);
            contentType = 'application/json';
        } else {
            responseData = response.data;
            contentType = 'text/plain';
        }

        const dateObj = new Date();

        // adjust 0 before single digit date
        const day = ('0' + dateObj.getDate()).slice(-2);
        const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        const year = dateObj.getFullYear();

        const filename = `gh_${year}-${month}-${day}`;

        // Compress file
        logger.info('Compressing results into a zip file');
        const buffer = Buffer.from(responseData, 'utf-8');
        const zip = new JSZip();
        zip.file(`${filename}.${workerData.format}`, buffer);
        const zippedFile = await new Promise((resolve, reject) => {
            zip.generateAsync({ type: 'nodebuffer'}).then((content) => {
                resolve(content);
            }).catch((error) => {
                reject(error);
            });
        });
        
        AWS.config.update({
            accessKeyId: workerData.accessKeyId,
            secretAccessKey: workerData.secretKey,
            region: workerData.region,
        });

        // If in locale2e env, use localstack
        const serviceEnv = process.env.SERVICE_ENV;

        let s3;
        let ses;

        if (serviceEnv == 'locale2e') {
            const localstackURL = process.env.LOCALSTACK_URL;
            ses = new AWS.SES({
                apiVersion: '2010-12-01',
                endpoint: localstackURL
            });
            s3 = new AWS.S3({ endpoint: localstackURL });
        } else {
            ses = new AWS.SES({ apiVersion: '2010-12-01' });
            s3 = new AWS.S3();
        }

        // Upload file to S3
        logger.info(`Uploading file ${filename} to S3`);
        const fileKey = `${dateObj.getTime()}/${filename}.zip`;
        const params = {
            Bucket: 'covid19-filtered-downloads',
            Key: fileKey,
            Body: zippedFile,
            ContentType: 'application/zip',
        }

        try {
            await new Promise((resolve, reject) => {
                s3.putObject(params, (error, data) => {
                    if (error) reject(error);
                    
                    resolve(data);
                });
            });
            
            // Generate presigned url
            const urlParams = {
                Bucket: 'covid19-filtered-downloads',
                Key: fileKey,
                Expires: 24 * 60 * 3, // 3 days
                ResponseContentDisposition:
                    `attachment; filename ="${filename}.zip"`,
            }

            const signedUrl = await new Promise((resolve, reject) => {
                s3.getSignedUrl('getObject', urlParams, (error, url) => {
                    if (error) reject(error);

                    resolve(url);
                });
            });

            // Send signed url via email to user
            logger.info(`Sending presigned URL ${signedUrl} to user`);
            const mailMessage = `
            <p>Please visit the link below to download list of cases in response to your query <strong>${workerData.query}</strong>.</p>

            <a href="${signedUrl}">Click here to download the data</a>
            
            <p>Kind regards,</p>
            
            <p>The Global.health team.</p>`;

            const emailParams = {
                Destination: {
                    ToAddresses: [
                        workerData.email
                    ]
                },
                Message: {
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data: mailMessage
                        },                    
                    },
                    Subject: {
                        Charset: 'UTF-8',
                        Data: 'Here is your Global.health download' 
                    }
                },
                Source: 'info@global.health'
            };

            ses.sendEmail(emailParams).promise().then((data) => {
                logger.info(
                    `sent email with correlation id ${workerData.correlationId}`,
                );
                logger.info('response from Amazon:');
                logger.info(data);
            }).catch((error) => {
                throw(error);
            });                        
        } catch (error) {            
            logger.error(error);
        }                
    });        
} catch (err) {
    logger.error(err);
}

logger.info('Asynchronous download worker finished');
