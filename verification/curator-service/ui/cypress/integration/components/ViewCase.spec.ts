/* eslint-disable no-undef */
describe('View case', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    // View of a full case is covered in the curator test.
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
            cy.visit(`cases/view/${resp.body.cases[0]._id}`);
            cy.contains('France');
            cy.contains('some notes');
            cy.contains('www.example.com');
            cy.contains('PCR test');
            cy.contains('French');
            cy.contains('Andorrean');
        });
    });
});
