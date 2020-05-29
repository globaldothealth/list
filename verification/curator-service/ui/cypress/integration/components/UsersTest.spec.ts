/* eslint-disable no-undef */
describe('Manage users page', function () {
    beforeEach(() => {
        cy.task('clearUsersDB', {});
    });

    it('Displays roles for users', function () {
        cy.login('Alice', 'alice@test.com', ['admin']);
        cy.login('Bob', 'bob@test.com', ['curator', 'reader']);
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
        cy.login('Alice', 'alice@test.com', ['admin']);
        cy.login('Bob', 'bob@test.com', ['curator', 'reader']);
        cy.visit('/users');
        cy.contains('Bob');
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

        cy.get('th[data-testid="Bob-roles"]').contains('curator');
        cy.get('th[data-testid="Bob-roles"]').contains('admin');
        cy.get('th[data-testid="Bob-roles"]')
            .contains('reader')
            .should('not.exist');

        // Roles are maintained on refresh
        cy.visit('/users');
        cy.get('th[data-testid="Bob-roles"]').contains('curator');
        cy.get('th[data-testid="Bob-roles"]').contains('admin');
        cy.get('th[data-testid="Bob-roles"]')
            .contains('reader')
            .should('not.exist');
    });
});
