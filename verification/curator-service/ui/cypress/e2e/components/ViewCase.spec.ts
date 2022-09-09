import { getDefaultQuery } from '../../utils/helperFunctions';

/* eslint-disable no-undef */
describe('View case', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('shows highlighted the searched text', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes travelled from the United States',
            sourceUrl: 'www.example.com',
            methodOfConfirmation: 'PCR test',
            nationalities: ['Andorrean', 'French'],
        });

        cy.intercept('GET', getDefaultQuery({ limit: 50 })).as('getCases');
        cy.visit('/');

        cy.visit('/cases');
        cy.wait('@getCases');

        cy.get('input[id="search-field"]').type('example{enter}');

        cy.get('body').then(($body) => {
            if ($body.find('.iubenda-cs-accept-btn').length) {
                cy.get('.iubenda-cs-accept-btn').click();
            }
        });
        cy.contains('France').click();
        cy.get('.highlighted').children('mark').contains('example');
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
            cy.visit('/');
            cy.contains('France').click();

            cy.contains('France');
            cy.should('not.contain', 'some notes');
            cy.contains('www.example.com');
            cy.contains('PCR test');
            cy.contains('French');
            cy.contains('Andorrean');
        });
    });
});
