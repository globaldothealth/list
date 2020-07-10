/* eslint-disable no-undef */
describe('App', function () {
    it('takes user to home page when home button is clicked', function () {
        cy.login();
        cy.visit('/cases');
        cy.url().should('eq', 'http://localhost:3002/cases');

        cy.contains('Home');
        cy.get('span').contains('Home').click();
        cy.url().should('eq', 'http://localhost:3002/');
    });

    it('shows login button when logged out', function () {
        cy.visit('/');

        cy.contains('Login');
    });

    it('shows logout button when logged in', function () {
        cy.login({ name: 'Alice Smith', email: 'alice@test.com', roles: [] });
        cy.visit('/');

        cy.contains('Logout alice@test.com');
    });

    it('Homepage with logged out user', function () {
        cy.visit('/');

        cy.contains('Please login');
        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Charts');
        cy.contains('Profile').should('not.exist');
        cy.contains('Manage users').should('not.exist');
    });

    it('Charts', function () {
        cy.visit('/charts');

        cy.contains('Completeness');
        cy.contains('Cumulative');
        cy.contains('Freshness');
    });

    it('Homepage with logged in user with no roles', function () {
        cy.login({ roles: [] });
        cy.visit('/');

        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Charts');
        cy.contains('Profile');
        cy.contains('Manage users').should('not.exist');
    });

    it('Homepage with logged in admin', function () {
        cy.login({ roles: ['admin'] });
        cy.visit('/');

        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Charts');
        cy.contains('Profile');
        cy.contains('Manage users');
    });

    it('Homepage with logged in curator', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.contains('Create new');
        cy.contains('Linelist');
        cy.contains('Sources');
        cy.contains('Profile');
        cy.contains('Charts');
        cy.contains('Manage users').should('not.exist');
    });

    it('Homepage with logged in reader', function () {
        cy.login({ roles: ['reader'] });
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Linelist');
        cy.contains('Sources');
        cy.contains('Charts');
        cy.contains('Profile');
        cy.contains('Manage users').should('not.exist');
    });

    it('Can open new case modal from create new button', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.contains('New case').should('not.exist');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.get('li').first().should('contain', 'New line list case').click();
        cy.contains('New case');
    });
});
