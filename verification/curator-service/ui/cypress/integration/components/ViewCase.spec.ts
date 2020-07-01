/* eslint-disable no-undef */
describe('View case', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Errors when case does not exist', function () {
        cy.visit('/cases/view/foo');
        cy.contains('Request failed');
    });

    it('can view a minimal case', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
            methodOfConfirmation: 'PCR test',
            nationalities: ['Andorrean', 'French'],
        });
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.visit(`/cases/view/${resp.body.cases[0]._id}`);
            cy.contains('France');
            cy.contains('some notes');
            cy.contains('www.example.com');
            cy.contains('PCR test');
            cy.contains('French');
            cy.contains('Andorrean');
        });
    });

    it('can view a full case', function () {
        cy.addFullCase();
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.visit(`/cases/view/${resp.body.cases[0]._id}`);
            cy.contains('Asian');
            // Further tests are already done in the unit tests.
            // No need to fully duplicate those here.
        });
    });
});
