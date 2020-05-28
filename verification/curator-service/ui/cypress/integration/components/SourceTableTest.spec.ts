/* eslint-disable no-undef */
describe('Sources table', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
    });

    it('Can add a source', function () {
        cy.visit('/sources');
        cy.contains('Example source').should('not.exist');

        cy.get('button[title="Add"]').click();
        cy.get('input[placeholder="Name"]').clear().type('Example source');
        cy.get('input[placeholder="URL"]').clear().type('www.example.com');
        cy.get('button[title="Save"]').click();

        cy.contains('Example source');
    });

    it('Can edit a source', function () {
        cy.addSource('Example source', 'www.example.com');
        cy.visit('/sources');
        cy.contains('Example source');

        cy.get('button[title="Edit"]').click();
        cy.get('input[placeholder="Name"]').clear().type('Edited source');
        cy.get('button[title="Save"]').click();

        cy.contains('Example source').should('not.exist');
        cy.contains('Edited source');
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
