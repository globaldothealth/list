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

    it('Can delete a source', function () {
        cy.addSource('Example source', 'www.example.com');
        cy.visit('/sources');
        cy.contains('Example source');

        cy.get('button[title="Delete"]').click();
        cy.get('button[title="Save"]').click();

        cy.contains('Example source').should('not.exist');
    });
});
