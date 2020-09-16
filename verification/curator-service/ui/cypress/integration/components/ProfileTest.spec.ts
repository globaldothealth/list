/* eslint-disable no-undef */
describe('Profile', function () {
    it('Profile shows user information', function () {
        cy.login({
            name: 'Alice Smith',
            email: 'alice@test.com',
            roles: ['curator'],
        });
        cy.visit('/profile');

        cy.contains('Alice Smith');
        cy.contains('alice@test.com');
        cy.contains('curator');
    });
});
