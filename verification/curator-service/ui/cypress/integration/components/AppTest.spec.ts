/* eslint-disable no-undef */
describe('App', function () {
    it('Homepage with logged out user', function () {
        cy.visit('/');

        cy.contains('Linelist');
        cy.contains('Sources');
        cy.contains('Manage users');
        cy.contains('Privacy policy');
        cy.contains('Terms of service');
    });

    it('Homepage with logged in user', function () {
        cy.login();
        cy.visit('/');

        cy.contains('Linelist');
        cy.contains('Sources');
        cy.contains('Profile');
        cy.contains('Manage users');
        cy.contains('Privacy policy');
        cy.contains('Terms of service');
    });
});
