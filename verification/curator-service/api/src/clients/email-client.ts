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
    private constructor(
        private readonly service: EmailService,
        private readonly transport: Mail,
    ) {}

    /**
     * Creates a client instance based on the provided user/pass,
     *
     * Both params must be provided to establish a real (Gmail-based)
     * connection. If either is absent, a testing service (Ethereal) is used.
     *
     * @param user - The email address to send mail from (e.g. foo@gmail.com).
     * @param password - The password for the above account.
     */
    static async create(
        user?: string,
        password?: string,
    ): Promise<EmailClient> {
        let service: EmailService;
        let transport: Mail;
        if (!user || !password) {
            service = EmailService.Ethereal;
            const testAccount = await nodemailer.createTestAccount();
            transport = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
        } else {
            service = EmailService.Gmail;
            transport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: user,
                    pass: password,
                },
            });
        }

        return new EmailClient(service, transport);
    }

    /**
     * Sends an email via the configured transport.
     *
     * @param addressees - Addressees to whom the email is sent.
     * @param subject - Subject of the email.
     * @param text - Body/content of the email.
     */
    send = (
        addressees: string[],
        subject: string,
        text: string,
    ): Promise<SentMessageInfo> => {
        const mailOptions = {
            to: addressees,
            subject: subject,
            text: text,
        };
        return this.transport.sendMail(mailOptions);
    };

    /**
     * Getter returning the configured SMTP service.
     */
    getService = (): EmailService => {
        return this.service;
    };
}
