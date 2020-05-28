/* eslint-disable no-undef */
describe('Linelist table', function () {
    beforeEach(() => {
        cy.task('clearDB', {});
        cy.request({
            url: '/auth/register',
            method: 'POST',
            body: {
                name: 'superuser',
                email: 'superuser@test.com',
                roles: ['admin', 'curator', 'reader'],
            },
        });
    });

    it('Can add a case', function () {
        cy.visit('/cases');
        cy.contains('test notes').should('not.exist');

        cy.get('button[title="Add"]').click();
        cy.get('input[placeholder="Country"]').clear().type('France');
        cy.get('input[placeholder="Notes"]').clear().type('test notes');
        cy.get('input[placeholder="Source URL"]')
            .clear()
            .type('www.example.com');
        cy.get('button[title="Save"]').click();

        cy.contains('test notes');
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
