/* eslint-disable no-undef */
describe.only('LandingPage', function () {
    it('The landing page shows two ways of login', function () {
        cy.visit('/');
        cy.contains('Welcome to G.h Data.');
        cy.contains('Sign in with username and password');
        cy.contains('Or sign in with Google');

        cy.get('button[data-testid="sign-in-button"]').should('be.visible');
        cy.get('button[data-testid="sign-in-button"]')
            .should('have.attr', 'type')
            .and('equal', 'submit');
    });

    it('Homepage with logged out user', function () {
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Charts').should('not.exist');
        cy.contains('Line list').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users').should('not.exist');

        cy.contains('Detailed line list data');
        cy.contains('Terms of use');
    });

    it('Homepage with logged in user with no roles', function () {
        cy.login({ roles: [], name: "xyz", email:'test@test.com' });
        cy.visit('/');

        // Readers-only are redirected to the line list.
        cy.url().should('eq', 'http://localhost:3002/cases');

        cy.contains('Create new').should('not.exist');
        cy.contains('Charts').should('not.exist');
        cy.contains('Line list');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users').should('not.exist');
        cy.contains('Terms of use');
    });

    it('Homepage with logged in admin', function () {
        cy.login({ roles: ['admin'] ,name: "testName", email:'test@example.com' });
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Charts');
        cy.contains('Line list');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users');
        cy.contains('Terms of use');
    });

    it('Homepage with logged in curator', function () {
        cy.login({ roles: ['curator'], name: "testName", email:'test@example.com' });
        cy.visit('/');

        cy.contains('Create new');
        cy.contains('Charts');
        cy.contains('Line list');
        cy.contains('Sources');
        cy.contains('Uploads');
        cy.contains('Manage users').should('not.exist');
        cy.contains('Terms of use');
    });

});
