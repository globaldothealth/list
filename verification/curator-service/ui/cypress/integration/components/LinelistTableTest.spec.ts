/* eslint-disable no-undef */
describe('Linelist table', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login({
            email: 'test@bar.com',
            name: 'test',
            roles: ['admin', 'curator', 'reader'],
        });
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

    it('Can open and close the edit modal', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('some notes');
        cy.contains('Edit case').should('not.exist');
        cy.get('button[data-testid="row menu"]').click();
        cy.contains('li', 'Edit').click();
        cy.contains('Edit case');
        cy.get('button[aria-label="close overlay"').click();
        cy.contains('Edit case').should('not.exist');
    });

    it('Can open and close the details modal', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('some notes');
        cy.contains('View case').should('not.exist');
        cy.contains('td', 'France').click({ force: true });
        cy.contains('View case');
        cy.get('button[aria-label="close overlay"').click();
        cy.contains('View case').should('not.exist');
    });

    it('Can delete a case', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('some notes');

        cy.get('button[data-testid="row menu"]').click();
        cy.contains('li', 'Delete').click();

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
        cy.server();
        cy.route('DELETE', '/api/cases/*').as('deleteCase');
        cy.get('button[title="Delete selected rows"]').click();
        cy.wait('@deleteCase');
        cy.wait('@deleteCase');

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
        cy.get('input[id="search-field"]').type('Uruguay{enter}');
        cy.contains('France').should('not.exist');
        cy.get('input[id="search-field"]').clear().type('France{enter}');
        cy.get('td[value="France"]');
    });
});
