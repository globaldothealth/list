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
            sourceUrl: 'www.example.com',
        });
        cy.addSource('Test source', 'www.example.com');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.visit(`cases/edit/${resp.body.cases[0]._id}`);
            // Check that we have something from the original case.
            cy.contains('France');
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

            // Updated info should be there.
            cy.contains(`Case ${resp.body.cases[0]._id} edited`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('Female');
            cy.contains('21');
            // What's untouched should stay as is.
            cy.contains('France');
        });
    });
});
