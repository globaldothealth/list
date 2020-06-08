/* eslint-disable no-undef */
describe('Manage users page', function () {
    beforeEach(() => {
        cy.task('clearUsersDB', {});
    });

    it('Displays roles for users', function () {
        cy.login({
            name: 'Bob',
            email: 'bob@test.com',
            roles: ['curator', 'reader'],
        });
        cy.login({ name: 'Alice', email: 'alice@test.com', roles: ['admin'] });
        cy.visit('/users');

        cy.contains('Alice');
        cy.get('th[data-testid="Alice-roles"]').contains('admin');
        cy.get('th[data-testid="Alice-roles"]')
            .contains('curator')
            .should('not.exist');
        cy.get('th[data-testid="Alice-roles"]')
            .contains('reader')
            .should('not.exist');
        cy.contains('Bob');
        cy.get('th[data-testid="Bob-roles"]').contains('curator');
        cy.get('th[data-testid="Bob-roles"]').contains('reader');
        cy.get('th[data-testid="Bob-roles"]')
            .contains('admin')
            .should('not.exist');
    });

    it('Can change a users roles', function () {
        cy.login({
            name: 'Bob',
            email: 'bob@test.com',
            roles: ['curator', 'reader'],
        });
        cy.login({ name: 'Alice', email: 'alice@test.com', roles: ['admin'] });
        cy.visit('/users');
        cy.contains('Bob');
        console.log('in here');
        cy.get('th[data-testid="Bob-roles"]').contains('curator');
        cy.get('th[data-testid="Bob-roles"]').contains('reader');
        cy.get('th[data-testid="Bob-roles"]')
            .contains('admin')
            .should('not.exist');

        // Select new roles
        cy.get('div[data-testid="Bob-select-roles"]').click();
        cy.get('li[data-value="admin"]').click();
        cy.get('li[data-value="reader"]').click();
        // Close popup
        cy.get('ul').type('{esc}');

        console.log('in here 2');
        cy.get('th[data-testid="Bob-roles"]').contains('curator');
        cy.get('th[data-testid="Bob-roles"]').contains('admin');
        cy.get('th[data-testid="Bob-roles"]')
            .contains('reader')
            .should('not.exist');

        // Roles are maintained on refresh
        cy.visit('/users');
        console.log('in here 3');
        cy.get('th[data-testid="Bob-roles"]').contains('curator');
        cy.get('th[data-testid="Bob-roles"]').contains('admin');
        cy.get('th[data-testid="Bob-roles"]')
            .contains('reader')
            .should('not.exist');
    });

    it('Updated roles propagate to other pages', function () {
        cy.login({ name: 'Alice', email: 'alice@test.com', roles: ['admin'] });
        cy.visit('/users');

        // Select new role
        cy.get('div[data-testid="Alice-select-roles"]').click();
        cy.get('li[data-value="reader"]').click();
        // Close popup
        cy.get('ul').type('{esc}');

        // Home page has reader links
        cy.visit('/');
        cy.contains('Linelist');

        // Profile page is updated
        cy.visit('/profile');
        cy.contains('admin, reader');
    });
});
