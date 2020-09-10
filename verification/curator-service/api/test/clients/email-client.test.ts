import EmailClient, { EmailService } from '../../src/clients/email-client';

describe('create', () => {
    it('can send ethereal emails without user or pass', async () => {
        const client = await EmailClient.create();
        expect(client.getService()).toBe(EmailService.Ethereal);
    });
    it('uses gmail if given user and pass', async () => {
        const client = await EmailClient.create('user@gmail.com', 'hunter2');
        expect(client.getService()).toBe(EmailService.Gmail);
    });
});

describe('send', () => {
    it('sends specified properties via email', async () => {
        const client = await EmailClient.create();
        const address = 'foo@bar.com';
        const result = await client.send(
            [address],
            'untestable subject',
            'untestable text content',
        );

        expect(result.accepted).toContain(address);
    });
});
