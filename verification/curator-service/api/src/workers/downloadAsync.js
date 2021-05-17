const { workerData } = require('worker_threads');
const axios = require('axios');
const AWS = require('aws-sdk');
const pino = require('pino');

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
    }).then((response) => {
        let responseData;
        let contentType;

        if (workerData.format === 'json') {
            responseData = JSON.stringify(response.data);
            contentType = 'application/json';
        } else {
            responseData = response.data;
            contentType = 'text/plain';
        }

        const buffer = Buffer.from(responseData, 'utf-8');
        const base64 = buffer.toString('base64');
        // send the email using SES
        AWS.config.update({
            accessKeyId: workerData.accessKeyId,
            secretAccessKey: workerData.secretKey,
            region: workerData.region,
        });
        const ses = new AWS.SES({ apiVersion: '2010-12-01' });

        /* I originally tried using the mimemessage library for this, but because the
         * worker is outside the main .ts app the build pipeline just shook the module
         * out of the tree so it would crash at runtime. So, old-school knowledge of how
         * to write email attachments by hand (and trolling Usenet groups with spurious
         * attachments) will have to suffice.
         */
        var mailMessage = `From: "Global.health" <${workerData.sourceAddress}>        
To: ${workerData.email}
Subject: Here is your Global.health download
Content-Type: multipart/mixed; boundary="part-boundary"

--part-boundary
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

Please see the attached list of cases in response to your query ${workerData.query}.

Kind regards,

The Global.health team.

--part-boundary
Content-Type: ${contentType}; name="g_dot_h_cases.${workerData.format}"
Content-Disposition: attachment; filename="g_dot_h_cases.${workerData.format}"
Content-Transfer-Encoding: base64

${base64}

--part-boundary--`;

        ses.sendRawEmail(
            {
                RawMessage: { Data: mailMessage },
            },
            (err, data) => {
                logger.info(
                    `sent email with correlation id ${workerData.correlationId}`,
                );
                if (err) {
                    logger.error('error:');
                    logger.error(err);
                }
                if (data) {
                    logger.info('response from Amazon:');
                    logger.info(data);
                }
            },
        );
    });
} catch (err) {
    logger.error(err);
}
