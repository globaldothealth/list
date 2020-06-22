/* eslint-disable no-undef */
describe('Linelist table', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Can edit a case', function () {
        cy.addCase('France', 'some notes', 'www.example.com');
        cy.visit('/cases');
        cy.contains('some notes');

        cy.get('button[title="Edit"]').click();
        cy.get('input[placeholder="Notes"]').clear().type('edited notes');
        cy.get('button[title="Save"]').click();

        cy.contains('some notes').should('not.exist');
        cy.contains('edited notes');
    });

    it('Can delete a case', function () {
        cy.addCase('France', 'some notes', 'www.example.com');
        cy.visit('/cases');
        cy.contains('some notes');

        cy.get('button[title="Delete"]').click();
        cy.get('button[title="Save"]').click();

        cy.contains('some notes').should('not.exist');
    });
});
