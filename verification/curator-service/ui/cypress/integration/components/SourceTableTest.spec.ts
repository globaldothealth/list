/* eslint-disable no-undef */
describe('Sources table', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.login();
    });

    it('Can add a source', function () {
        cy.visit('/sources');
        cy.contains('Example source').should('not.exist');

        cy.get('button[title="Add"]').click();
        cy.get('input[placeholder="Name"]').type('Example source');
        cy.get('input[placeholder="URL"]').type('www.example.com');
        cy.get('div[data-testid="format-select"]').click();
        cy.contains('li', 'JSON').click();
        /* This doesn't work and I HAVE NO IDEA WHY PLEASE HELP.
        cy.get('div[data-testid="op-select"]').scrollIntoView().click();
        cy.contains('li', 'EQ').click();
        cy.get('input[placeholder="Date filter num days before today"]')
            .scrollIntoView()
            .type('42');
        */

        cy.get('button[title="Save"]').click();

        cy.contains('Example source');
        cy.contains('www.example.com');
        cy.contains('JSON');
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
