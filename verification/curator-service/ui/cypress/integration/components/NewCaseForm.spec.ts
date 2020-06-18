/* eslint-disable no-undef */
describe('New case form', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    it('Can add row to linelist', function () {
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/cases/new');
        cy.get('div[data-testid="sex"]').click();
        cy.get('li[data-value="Female"').click();
        cy.get('input[name="age"]').clear().type('21');
        cy.get('div[data-testid="ethnicity"]').click();
        cy.get('li[data-value="Asian"').click();
        cy.get('div[data-testid="nationalities"]').type('Afghan');
        cy.get('li').first().should('contain', 'Afghan').click();
        cy.get('div[data-testid="nationalities"]').type('Albanian');
        cy.get('li').first().should('contain', 'Albanian').click();
        cy.get('input[name="country"]').clear().type('France');
        cy.get('input[name="confirmedDate"]').clear().type('2020-01-01');
        cy.get('input[name="sourceUrl"]').clear().type('www.example.com');
        cy.get('input[name="notes"]').clear().type('test notes');
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');

        cy.visit('/cases');
        cy.contains('No records to display').should('not.exist');
        cy.contains('Female');
        cy.contains('21');
        cy.contains('Asian');
        cy.contains('Afghan, Albanian');
        cy.contains('France');
        cy.contains('1/1/2020');
        cy.contains('www.example.com');
        cy.contains('test notes');
    });

    it('Does not add row on submission error', function () {
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/cases/new');
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.contains('Request failed');

        cy.visit('/cases');
        cy.contains('No records to display');
    });

    it('Shows checkbox on field completion', function () {
        cy.visit('/cases/new');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
        cy.get('input[name="country"]').clear().type('France');
        cy.get('svg[data-testid="check-icon"]').should('exist');
    });

    it('Shows error icon on field submission error', function () {
        cy.visit('/cases/new');
        cy.get('svg[data-testid="error-icon"]').should('not.exist');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
        cy.get('input[name="confirmedDate"]').clear().type('2020/02/31');
        cy.get('svg[data-testid="error-icon"]').should('exist');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
    });
});
