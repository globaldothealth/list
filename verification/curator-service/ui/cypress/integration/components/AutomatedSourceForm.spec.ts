/* eslint-disable no-undef */
describe('Automated source form', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.login();
    });

    it('Creates source given proper data', function () {
        cy.visit('/sources');
        cy.contains('No records to display');

        const url = 'www.newsource.com';
        const name = 'New source name';

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New automated source').click();
        cy.get('div[data-testid="url"]').type(url);
        cy.get('div[data-testid="name"]').type(name);
        cy.server();
        cy.route('POST', '/api/sources').as('createSource');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@createSource');

        // Check that all relevant fields are visible.
        cy.contains('No records to display').should('not.exist');
        cy.contains(url);
        cy.contains(name);
    });

    it('Does not add source on submission error', function () {
        cy.visit('/sources');
        cy.contains('No records to display');

        cy.visit('/sources/automated');
        cy.get('div[data-testid="url"]').type('www.newsource.com');
        cy.get('div[data-testid="name"]').type('New source name');

        // Force server to return error
        cy.server();
        cy.route({
            method: 'POST',
            url: '/api/sources',
            status: 422,
            response: {},
        }).as('createSource');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@createSource');
        cy.contains('Request failed');

        cy.visit('/sources');
        cy.contains('No records to display');
    });
});
