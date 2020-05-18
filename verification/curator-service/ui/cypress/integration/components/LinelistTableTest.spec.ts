describe('Linelist table', function () {
    beforeEach(() => {
        cy.task('clearDB', {});
    })

    it('Can add a case', function () {
        cy.visit('/cases');
        cy.get('button[title="Add"]').first().click();
        cy.get('input[placeholder="Country"]').clear().type('France');
        cy.get('input[placeholder="Notes"]').clear().type('test notes');
        cy.get('input[placeholder="Source URL"]').clear().type('www.example.com');
        cy.get('button[title="Save"]').click();
        cy.contains('test notes');
    })
}) 