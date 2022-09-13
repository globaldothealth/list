/* eslint-disable no-undef */
describe('Sources table', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.login();
    });

    it('Can edit a source', function () {
        cy.addSource(
            'Example source',
            'www.example.com',
            'Example',
            'www.example.com',
            ['US', 'CA', 'MX'],
        );

        cy.intercept('GET', '/api/sources/?limit=10&page=1').as('fetchSources');

        cy.visit('/');
        cy.contains('Sources').click();

        cy.wait('@fetchSources');

        cy.contains('Example source');

        cy.get('button[aria-label="Edit"]').click();
        cy.get('input[value="Example source"]').clear().type('Edited source');
        cy.get('button[aria-label="Save"]').click();

        cy.wait(300);
        cy.contains('Example source').should('not.exist');
        cy.contains('Edited source');
    });

    it('Can update date filters', function () {
        cy.addSource(
            'Example source',
            'www.example.com',
            'Example',
            'www.example.com',
            ['US', 'CA', 'MX'],
        );

        cy.intercept('GET', '/api/sources/?limit=10&page=1').as('fetchSources');

        cy.visit('/');
        cy.contains('Sources').click();

        cy.wait('@fetchSources');

        cy.contains('Example source');

        // Set up date filtering.
        cy.get('button[aria-label="Edit"]').click();
        cy.get('div[data-testid="op-select"]').click();
        cy.get('li[data-value="LT"]').click();
        cy.get('input[placeholder="days"]').clear().type('3');
        cy.get('button[aria-label="Save"]').click();
        cy.contains(/up to 3 day\(s\) ago/);

        // Now change to another operator.
        cy.get('button[aria-label="Edit"]').click();
        cy.get('div[data-testid="op-select"]').click();
        cy.get('li[data-value="EQ"]').click();
        cy.get('input[placeholder="days"]').clear().type('5');
        cy.get('button[aria-label="Save"]').click();
        cy.contains(/from 5 day\(s\) ago/);

        // Now clear date filter.
        cy.get('button[aria-label="Edit"]').click();
        cy.get('button[data-testid="clear-date-filter"]').click();
        cy.get('button[aria-label="Save"]').click();
        cy.contains(/from 5 day\(s\) ago/).should('not.exist');
    });

    it('Can delete a source', function () {
        cy.addSource(
            'Example source',
            'www.example.com',
            'Example',
            'www.example.com',
            ['US', 'CA', 'MX'],
        );
        cy.intercept('GET', '/api/sources/?limit=10&page=1').as('fetchSources');

        cy.visit('/');
        cy.contains('Sources').click();

        cy.wait('@fetchSources');

        cy.contains('Example source');

        cy.get('button[aria-label="Delete"]').click();
        cy.get('button[aria-label="Save"]').click();

        cy.contains('Example source').should('not.exist');
    });
});
