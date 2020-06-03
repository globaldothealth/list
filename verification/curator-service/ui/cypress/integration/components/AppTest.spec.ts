/* eslint-disable no-undef */
describe('App', function () {
    it('Homepage with logged out user', function () {
        cy.visit('/');

        cy.contains('Login to access Epid');
        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Cumulative charts').should('not.exist');
        cy.contains('Profile').should('not.exist');
        cy.contains('Manage users').should('not.exist');
    });

    it('Homepage with logged in user with no roles', function () {
        cy.login({ roles: [] });
        cy.visit('/');

        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Cumulative charts').should('not.exist');
        cy.contains('Profile');
        cy.contains('Manage users').should('not.exist');
    });

    it('Homepage with logged in admin', function () {
        cy.login({ roles: ['admin'] });
        cy.visit('/');

        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Cumulative charts').should('not.exist');
        cy.contains('Profile');
        cy.contains('Manage users');
    });

    it('Homepage with logged in curator', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.contains('Linelist');
        cy.contains('Sources');
        cy.contains('Profile');
        cy.contains('Cumulative charts').should('not.exist');
        cy.contains('Manage users').should('not.exist');
    });

    it('Homepage with logged in reader', function () {
        cy.login({ roles: ['reader'] });
        cy.visit('/');

        cy.contains('Linelist');
        cy.contains('Sources');
        cy.contains('Cumulative charts');
        cy.contains('Profile');
        cy.contains('Manage users').should('not.exist');
    });
});
