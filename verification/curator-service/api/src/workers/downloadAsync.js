/* eslint-disable */
const { workerData } = require('worker_threads');
const axios = require('axios');
const AWS = require('aws-sdk');
const pino = require('pino');
const JSZip = require('jszip');
const fs = require('fs');

const logger = pino({
    prettyPrint: { colorize: false },
});

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
        const ses = new AWS.SES({ apiVersion: '2010-12-01' });

        // Upload file to S3
        const s3 = new AWS.S3();

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
                Source: 'ghdsi.info@gmail.com'
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
