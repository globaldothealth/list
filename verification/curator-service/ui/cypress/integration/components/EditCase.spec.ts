/* eslint-disable no-undef */
describe('Edit case', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    // Full case edit is covered in the curator tests.
    it('can edit a case', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
            methodOfConfirmation: 'PCR test',
            nationalities: ['Andorrean', 'French'],
        });
        cy.visit('cases');
        cy.get('button[title="Edit this case"]').click({ force: true });
        // Check that we have something from the original case.
        cy.contains('France');
        cy.contains('Andorrean');
        cy.contains('French');
        cy.contains('Female').should('not.exist');
        cy.contains('21').should('not.exist');
        // Change a few things.
        cy.get('div[data-testid="gender"]').click();
        cy.get('li[data-value="Female"').click();
        cy.get('input[name="age"]').type('21');
        // Submit the changes.
        cy.server();
        cy.route('PUT', `/api/cases/*`).as('editCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@editCase');
        cy.contains('Case edited');
        // Updated info should be there.
        cy.get('button[aria-label="close overlay"').click();
        cy.contains('No records to display').should('not.exist');
        cy.contains('Female');
        cy.contains('21');
        // What's untouched should stay as is.
        cy.contains('Andorrean');
        cy.contains('French');
    });
});
