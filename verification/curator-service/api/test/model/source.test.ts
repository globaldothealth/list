import { Source } from '../../src/model/source';

describe('Source schema', () => {
    it('should build a valid source', () => {
        const errors = new Source({
            name: 'test source',
            origin: {
                url: 'http://foo.bar',
            },
            automation: {
                scheduleExpression: 'cron(0 12 * * ? *)',
            },
        }).validateSync();
        expect(errors).toBeUndefined();
    });
    it('should fail validation if source is invalid', () => {
        const errors = new Source({}).validateSync();
        expect(errors).toBeDefined();
        expect(errors?.toString()).toMatch('Enter a name');
        expect(errors?.toString()).toMatch('Enter an origin');
    });
});
