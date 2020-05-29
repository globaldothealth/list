/* eslint-disable no-undef */
describe('EpidNavbar', function () {
    it('Home button takes user to home page', function () {
        cy.login();
        cy.visit('/cases');
        cy.url().should('eq', 'http://localhost:3002/cases');

        cy.get('button[data-testid="home-btn"]').click();
        cy.url().should('eq', 'http://localhost:3002/');
    });

    it('Navbar with logged out user', function () {
        cy.visit('/');

        cy.contains('Login');
    });

    it('Navbar with logged in user', function () {
        cy.login('Alice Smith', 'alice@test.com', []);
        cy.visit('/');

        cy.contains('Logout alice@test.com');
    });
});
