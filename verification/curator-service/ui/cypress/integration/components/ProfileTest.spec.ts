/* eslint-disable no-undef */
describe('Profile', function () {
    it('Profile shows user information', function () {
        cy.login('Alice Smith', 'alice@test.com', ['reader', 'curator']);
        cy.visit('/profile');

        cy.contains('Alice Smith');
        cy.contains('alice@test.com');
        cy.contains('reader, curator');
    });
});
