import EmailClient, { EmailService } from '../../src/clients/email-client';

describe('initialize', () => {
    it('uses ethereal without user or pass', async () => {
        const client = await new EmailClient().initialize();
        expect(client.getService()).toBe(EmailService.Ethereal);
    });
    it('uses gmail if given user and pass', async () => {
        const client = await new EmailClient(
            'user@gmail.com',
            'hunter2',
        ).initialize();
        expect(client.getService()).toBe(EmailService.Gmail);
    });
});

describe('send', () => {
    // This email service is not currently in use
    it.skip('sends specified properties via email', async () => {
        jest.setTimeout(15000);

        const client = await new EmailClient().initialize();
        const address = 'foo@bar.com';
        const result = await client.send(
            [address],
            'untestable subject',
            'untestable text content',
        );

        expect(result.accepted).toContain(address);
    });
    it('throws error if client uninitialized', async () => {
        const client = new EmailClient();
        expect(() => {
            client.send(['addressee'], 'subject', 'text');
        }).toThrow();
    });
});
