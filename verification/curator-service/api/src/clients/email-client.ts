import AWS from 'aws-sdk';
import { logger } from '../util/logger';

/**
 * Client that sends emails via AWS SES
 */
export default class EmailClient {
    private accessKeyId: string;
    private secretAccessKey: string;
    private region: string;
    private sourceEmail: string;
    private ses?: AWS.SES;
    private initialized = false;

    constructor(
        accessKeyId: string,
        secretAccessKey: string,
        region: string,
        sourceEmail: string,
    ) {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.region = region;
        this.sourceEmail = sourceEmail;
    }

    /**
     * Initializes a client based on the stored user and password fields.
     *
     * Both fields must be present to establish a real (Gmail-based)
     * connection. If either is absent, a testing service (Ethereal) is used.
     */
    initialize(): EmailClient {
        if (this.initialized) {
            return this;
        }

        AWS.config.update({
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
            },
            region: this.region,
        });

        this.ses = new AWS.SES({ apiVersion: '2010-12-01' });
        this.initialized = true;

        return this;
    }

    /**
     * Sends an email via the configured AWS SES.
     *
     * @param addressees - Addressees to whom the email is sent.
     * @param subject - Subject of the email.
     * @param text - Body/content of the email.
     */
    async send(
        addresses: string[],
        subject: string,
        message: string,
    ): Promise<unknown> {
        const emailParams = {
            Destination: {
                ToAddresses: addresses,
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: this.sourceEmail,
        };

        try {
            if (!this.ses) throw new Error('Email client not initialized');

            return await this.ses.sendEmail(emailParams).promise();
        } catch (error) {
            logger.info('Error while sending mail: ' + error);
            throw error;
        }
    }
}
