import { User } from '../../src/model/user';

describe('User schema', () => {
    it('should build a valid user', () => {
        const errors = new User({
            name: 'test source',
            email: 'foo@bar.com',
            googleID: 'baz',
            roles: ['admin', 'curator'],
        }).validateSync();
        expect(errors).toBeUndefined();
    });

    it('should fail validation if user is invalid', () => {
        const errors = new User({}).validateSync();
        expect(errors).toBeDefined();
        expect(errors?.toString()).toMatch('User must have an email');
    });

    it('should restrict roles to values in the enum', () => {
        const errors = new User({
            name: 'test source',
            email: 'foo@bar.com',
            googleID: 'baz',
            roles: ['brigadier'],
        }).validateSync();
        expect(errors).toBeDefined();
        expect(errors?.toString()).toContain('brigadier');
    });
});
