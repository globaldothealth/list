import nodemailer, { SentMessageInfo } from 'nodemailer';

import Mail from 'nodemailer/lib/mailer';

/**
 * The SMTP service to use for email.
 */
export enum EmailService {
    Gmail = 'Gmail',
    Ethereal = 'Ethereal',
}

/**
 * SMTP client that sends email via nodemailer.
 */
export default class EmailClient {
    private service?: EmailService;
    private transport?: Mail;
    private initialized = false;
    constructor(private user?: string, private password?: string) {}

    /**
     * Initializes a client based on the stored user and password fields.
     *
     * Both fields must be present to establish a real (Gmail-based)
     * connection. If either is absent, a testing service (Ethereal) is used.
     */
    async initialize(): Promise<EmailClient> {
        if (this.initialized) {
            return this;
        }

        if (!this.user || !this.password) {
            this.service = EmailService.Ethereal;
            const testAccount = await nodemailer.createTestAccount();
            this.transport = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
        } else {
            this.service = EmailService.Gmail;
            this.transport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: this.user,
                    pass: this.password,
                },
            });
        }

        this.initialized = true;
        return this;
    }

    /**
     * Sends an email via the configured transport.
     *
     * TODO: Add support for HTML email content.
     *
     * @param addressees - Addressees to whom the email is sent.
     * @param subject - Subject of the email.
     * @param text - Body/content of the email.
     */
    send(
        addressees: string[],
        subject: string,
        text: string,
    ): Promise<SentMessageInfo> {
        // These are synonymous, but Typescript-strictness requires the second
        // condition to operate on this.transport, below.
        if (!this.initialized || this.transport === undefined) {
            throw new Error('Must call initialize() prior to use.');
        }
        const mailOptions = {
            to: addressees,
            subject: subject,
            text: text,
        };
        return this.transport.sendMail(mailOptions);
    }

    /**
     * Getter returning the configured SMTP service.
     */
    getService(): EmailService | undefined {
        return this.service;
    }
}
