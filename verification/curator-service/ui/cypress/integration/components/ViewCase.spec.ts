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

    it('can view a case', function () {
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
            cy.contains('French');
        });
    });
});
