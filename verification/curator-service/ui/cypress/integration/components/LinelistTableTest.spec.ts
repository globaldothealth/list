/* eslint-disable no-undef */
describe('Linelist table', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Display case properly', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
            methodOfConfirmation: 'PCR test',
            curator: 'test@bar.com',
        });
        cy.visit('/cases');
        cy.contains('PCR test');
        cy.contains('some notes');
        cy.contains('France');
        cy.contains('www.example.com');
        cy.contains('test@bar.com');
    });

    it('Can go to the edit page', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('some notes');

        cy.get('button[title="Edit this case"]').click();
        cy.url().should('contain', '/cases/edit/');
    });

    it('Can delete a case', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('some notes');

        cy.get('button[title="Delete"]').click();
        cy.get('button[title="Save"]').click();

        cy.contains('some notes').should('not.exist');
    });

    it('Can search', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'foo.bar',
        });
        cy.visit('/cases');
        cy.contains('France');
        cy.get('input[placeholder="Search"]').type('Uruguay');
        cy.contains('France').should('not.exist');
        cy.get('input[placeholder="Search"]').clear().type('France');
        cy.get('td[value="France"]');
    });
});
