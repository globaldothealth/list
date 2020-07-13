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

    it('Can open the edit modal', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('some notes');

        cy.contains('Edit case').should('not.exist');
        cy.get('button[title="Edit this case"]').click();
        cy.contains('Edit case');
    });

    it('Can open the new case modal', function () {
        cy.visit('/cases');

        cy.contains('Create new COVID-19 line list case').should('not.exist');
        cy.get('button[title="Submit new case"]').click();
        cy.contains('Create new COVID-19 line list case');
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

    it('Can delete multiple cases', function () {
        cy.addCase({
            country: 'France',
        });
        cy.addCase({
            country: 'Germany',
        });
        cy.addCase({
            country: 'United Kingdom',
        });
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('Germany');
        cy.contains('United Kingdom');

        // Three row checkboxes and a header checkbox
        cy.get('input[type="checkbox"]').should('have.length', 4);
        cy.get('input[type="checkbox"]').eq(1).click();
        cy.get('input[type="checkbox"]').eq(3).click();
        cy.get('button[title="Delete selected rows"]').click();

        cy.contains('France').should('not.exist');
        cy.contains('Germany');
        cy.contains('United Kingdom').should('not.exist');
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
