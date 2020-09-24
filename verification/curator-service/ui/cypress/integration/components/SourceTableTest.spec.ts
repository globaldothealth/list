import { groupBy } from 'cypress/types/lodash';

/* eslint-disable no-undef */
describe('Sources table', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.login();
    });

    it('Can edit a source', function () {
        cy.addSource('Example source', 'www.example.com');
        cy.visit('/sources');
        cy.contains('Example source');

        cy.get('button[title="Edit"]').click();
        cy.get('input[placeholder="Name"]').clear().type('Edited source');
        cy.get('input[placeholder="Parsers"]')
            .clear()
            .type('arn:aws:lambda:us-east-1:612888738066:function:test-func');
        cy.get('button[title="Save"]').click();

        cy.contains('Example source').should('not.exist');
        cy.contains('Edited source');
        cy.contains('arn:aws:lambda:us-east-1:612888738066:function:test-func');
    });

    it('Can update date filters', function () {
        cy.addSource('Example source', 'www.example.com');
        cy.visit('/sources');
        cy.contains('Example source');

        // Set up date filtering.
        cy.get('button[title="Edit"]').click();
        cy.get('input[placeholder="Operator"]').parent().click();
        cy.get('li[data-value="LT"]').click();
        cy.get('input[placeholder="days"]').clear().type('3');
        cy.get('button[title="Save"]').click();
        cy.contains(/up to 3 day\(s\) ago/);

        // Now change to another operator.
        cy.get('button[title="Edit"]').click();
        cy.get('input[placeholder="Operator"]').parent().click();
        cy.get('li[data-value="EQ"]').click();
        cy.get('input[placeholder="days"]').clear().type('5');
        cy.get('button[title="Save"]').click();
        cy.contains(/from 5 day\(s\) ago/);

        // Now clear date filter.
        cy.get('button[title="Edit"]').click();
        cy.get('button[data-testid="clear-date-filter"]').click();
        cy.get('button[title="Save"]').click();
        cy.contains(/from 5 day\(s\) ago/).should('not.exist');
    });

    it('Can delete a source', function () {
        cy.addSource('Example source', 'www.example.com');
        cy.visit('/sources');
        cy.contains('Example source');

        cy.get('button[title="Delete"]').click();
        cy.get('button[title="Save"]').click();

        cy.contains('Example source').should('not.exist');
    });
});
