describe('Linelist table', function () {
    it('Can edit a case', function () {
        cy.visit('/cases');
        cy.get('button[title="Edit"]').first().click();
        cy.get('input[placeholder="Notes"]').clear().type('edited text');
        cy.get('button[title="Save"]').click();
        cy.contains('edited text');
    })
}) 