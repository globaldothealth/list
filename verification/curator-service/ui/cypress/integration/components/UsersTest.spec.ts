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
        cy.get('div[data-testid="Alice-select-roles"]').contains('admin');
        cy.get('div[data-testid="Alice-select-roles"]')
            .contains('curator')
            .should('not.exist');
        cy.get('div[data-testid="Alice-select-roles"]')
            .contains('reader')
            .should('not.exist');
        cy.contains('Bob');
        cy.get('div[data-testid="Bob-select-roles"]').contains('curator');
        cy.get('div[data-testid="Bob-select-roles"]').contains('reader');
        cy.get('div[data-testid="Bob-select-roles"]')
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
        cy.get('div[data-testid="Bob-select-roles"]').contains('curator');
        cy.get('div[data-testid="Bob-select-roles"]').contains('reader');
        cy.get('div[data-testid="Bob-select-roles"]')
            .contains('admin')
            .should('not.exist');

        // Select new roles
        cy.server();
        cy.route('PUT', '/api/users/*').as('updateUser');
        cy.route('GET', '/api/users/*').as('getUsers');
        cy.get('div[data-testid="Bob-select-roles"]').click();
        cy.get('li[data-value="admin"]').click();
        cy.wait('@updateUser');
        cy.wait('@getUsers');
        cy.get('div[data-testid="Bob-select-roles"]').click();
        cy.get('li[data-value="reader"]').click();
        cy.wait('@updateUser');
        cy.wait('@getUsers');

        cy.get('div[data-testid="Bob-select-roles"]').contains('curator');
        cy.get('div[data-testid="Bob-select-roles"]').contains('admin');
        cy.get('div[data-testid="Bob-select-roles"]')
            .contains('reader')
            .should('not.exist');

        // Roles are maintained on refresh
        cy.visit('/users');
        cy.get('div[data-testid="Bob-select-roles"]').contains('curator');
        cy.get('div[data-testid="Bob-select-roles"]').contains('admin');
        cy.get('div[data-testid="Bob-select-roles"]')
            .contains('reader')
            .should('not.exist');
    });

    it('Updated roles propagate to other pages', function () {
        cy.login({ name: 'Alice', email: 'alice@test.com', roles: ['admin'] });
        cy.visit('/users');

        // Select new role
        cy.server();
        cy.route('PUT', '/api/users/*').as('updateUser');
        cy.get('div[data-testid="Alice-select-roles"]').click();
        cy.get('li[data-value="reader"]').click();
        cy.wait('@updateUser');

        // Home page has reader links
        cy.visit('/');
        cy.contains('Linelist');

        // Profile page is updated
        cy.visit('/profile');
        cy.contains('admin');
        cy.contains('reader');
    });
});
