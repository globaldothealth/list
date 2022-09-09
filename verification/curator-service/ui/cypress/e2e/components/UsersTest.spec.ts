/* eslint-disable no-undef */
describe('Manage users page', function () {
    beforeEach(() => {
        cy.task('clearUsersDB', {});
    });

    it('Displays roles for users', function () {
        cy.login({
            name: 'Bob',
            email: 'bob@test.com',
            roles: ['curator'],
        });
        cy.login({ name: 'Alice', email: 'alice@test.com', roles: ['admin'] });
        cy.visit('/');
        cy.contains('Manage users').click();

        cy.contains('Alice');
        cy.get('div[data-testid="Alice-select-roles"]').contains('admin');
        cy.get('div[data-testid="Alice-select-roles"]')
            .contains('curator')
            .should('not.exist');
        cy.contains('Bob');
        cy.get('div[data-testid="Bob-select-roles"]').contains('curator');
        cy.get('div[data-testid="Bob-select-roles"]')
            .contains('admin')
            .should('not.exist');
    });

    it('Can change a users roles', function () {
        cy.login({
            name: 'Bob',
            email: 'bob@test.com',
            roles: ['curator'],
        });
        cy.login({ name: 'Alice', email: 'alice@test.com', roles: ['admin'] });
        cy.visit('/');
        cy.contains('Manage users').click();

        cy.contains('Bob');
        cy.get('div[data-testid="Bob-select-roles"]').contains('curator');
        cy.get('div[data-testid="Bob-select-roles"]')
            .contains('admin')
            .should('not.exist');

        // Select new roles
        cy.intercept('PUT', '/api/users/*').as('updateUser');
        cy.intercept('GET', '/api/users/*').as('getUsers');
        cy.get('div[data-testid="Bob-select-roles"]').click();
        cy.get('li[data-value="admin"]').click();
        cy.wait('@updateUser');
        cy.wait('@getUsers');
        cy.get('li[data-value="curator"]').click();
        cy.wait('@updateUser');
        cy.wait('@getUsers');

        cy.get('div[data-testid="Bob-select-roles"]').contains('admin');
        cy.get('div[data-testid="Bob-select-roles"]')
            .contains('curator')
            .should('not.exist');

        // Roles are maintained on refresh
        cy.visit('/');
        cy.contains('Manage users').click();
        cy.get('div[data-testid="Bob-select-roles"]').contains('admin');
        cy.get('div[data-testid="Bob-select-roles"]')
            .contains('curator')
            .should('not.exist');
    });

    it('Updated roles propagate to other pages', function () {
        cy.login({ name: 'Alice', email: 'alice@test.com', roles: ['admin'] });
        cy.visit('/');
        cy.contains('Manage users').click();

        // Select new role
        cy.intercept('PUT', '/api/users/*').as('updateUser');
        cy.wait(300);
        cy.get('div[data-testid="Alice-select-roles"]').click();
        cy.wait(300);
        cy.get('li[data-value="curator"]').click();
        cy.wait('@updateUser');

        // Home page has logged-in user links
        cy.visit('/');
        cy.contains('Line list');

        // Profile page is updated
        cy.get('button[data-testid="profile-menu"]').click();
        cy.contains('Profile').click();
        cy.contains('admin');
        cy.contains('curator');
    });
});
