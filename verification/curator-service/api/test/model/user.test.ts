import { User } from '../../src/model/user';

describe('User schema', () => {
    it('should build a valid user', () => {
        const errors = new User({
            name: 'test source',
            email: 'foo@bar.com',
            googleID: 'baz',
        }).validateSync();
        expect(errors).toBeUndefined();
    });
    it('should fail validation if user is invalid', () => {
        const errors = new User({}).validateSync();
        expect(errors).toBeDefined();
        expect(errors?.toString()).toMatch('User must have an email');
        expect(errors?.toString()).toMatch(
            'User must be logged-in with Google',
        );
    });
});
