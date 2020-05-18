/* eslint-disable no-undef */
describe('Linelist table', function () {
    it('Can add a case', function () {
        cy.visit('/cases');
        cy.get('button[title="Add"]').first().click();
        cy.get('input[placeholder="Country"]').clear().type('France');
        cy.get('input[placeholder="Notes"]').clear().type('test notes');
        cy.get('input[placeholder="Source URL"]')
            .clear()
            .type('www.example.com');
        cy.get('button[title="Save"]').click();
        // Assert the added row is present once we have cleared the DB before
        // the test. If the database hasn't been cleared, we don't know if
        // the element is on this page or not.
    });
});
