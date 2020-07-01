/* eslint-disable no-undef */
describe('Edit case', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Errors when case does not exist', function () {
        cy.visit('/cases/edit/foo');
        cy.contains('Request failed');
    });

    it('can edit a minimal case', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
            methodOfConfirmation: 'PCR test',
            nationalities: ['Andorrean', 'French'],
        });
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.visit(`/cases/edit/${resp.body.cases[0]._id}`);
            // Check that we have something from the original case.
            cy.contains('France');
            cy.contains('Andorrean');
            cy.contains('French');
            cy.contains('Female').should('not.exist');
            cy.contains('21').should('not.exist');
            // Change a few things.
            cy.get('div[data-testid="sex"]').click();
            cy.get('li[data-value="Female"').click();
            cy.get('input[name="age"]').type('21');
            // Submit the changes.
            cy.server();
            cy.route('PUT', `/api/cases/${resp.body.cases[0]._id}`).as(
                'editCase',
            );
            cy.get('button[data-testid="submit"]').click();
            cy.wait('@editCase');
            cy.contains('Case edited');
            // Updated info should be there.
            cy.visit('/cases');
            cy.contains('No records to display').should('not.exist');
            cy.contains('Female');
            cy.contains('21');
            // What's untouched should stay as is.
            cy.contains('Andorrean');
            cy.contains('French');
        });
    });

    it('can edit a full case', function () {
        cy.addFullCase();
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.visit(`/cases/edit/${resp.body.cases[0]._id}`);
            // Check that we could parse the original case.
            cy.contains('France');
            cy.contains('Swedish');
            cy.contains('Female');
            cy.contains('Actor').should('not.exist');
            // Change a few things.
            cy.get('div[data-testid="sex"]').click();
            cy.get('li[data-value="Male"').click();
            // Submit the changes.
            cy.server();
            cy.route('PUT', `/api/cases/${resp.body.cases[0]._id}`).as(
                'editCase',
            );
            cy.get('button[data-testid="submit"]').click();
            cy.wait('@editCase');
            cy.contains('Case edited');
            // Updated info should be there.
            cy.visit('/cases');
            cy.contains('No records to display').should('not.exist');
            cy.contains('Male');
            // What's untouched should stay as is.
            cy.contains('Swedish');
        });
    });
});
