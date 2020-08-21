/* eslint-disable no-undef */
describe('Sources table', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
    });

    it('Can add a source', function () {
        cy.login();
        cy.visit('/sources');
        cy.contains('Example source').should('not.exist');

        cy.get('button[title="Add"]').click();
        cy.get('input[placeholder="Name"]').type('Example source');
        cy.get('input[placeholder="URL"]').type('www.example.com');
        cy.get('div[data-testid="format-select"]').click();
        cy.contains('li', 'JSON').click();
        cy.get('div[data-testid="op-select"]').scrollIntoView().click();
        cy.contains('li', 'from exactly').click();
        cy.get('input[placeholder="days"]').type('42');

        cy.get('button[title="Save"]').click();

        cy.contains('Example source');
        cy.contains('www.example.com');
        cy.contains('JSON');
        cy.contains('Only parse data from 42 days ago');
        cy.contains('Curation actions');
    });

    it('cannot trigger retrieval if not a curator', function () {
        cy.login();
        cy.addSource('Example source', 'www.example.com');
        cy.login({ roles: ['reader'] });
        cy.visit('/sources');
        cy.contains('Example source');
        cy.contains('Curation actions').should('not.exist');
    });

    it('Can edit a source', function () {
        cy.login();
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
        cy.login();
        cy.addSource('Example source', 'www.example.com');
        cy.visit('/sources');
        cy.contains('Example source');

        cy.get('button[title="Delete"]').click();
        cy.get('button[title="Save"]').click();

        cy.contains('Example source').should('not.exist');
    });
});
