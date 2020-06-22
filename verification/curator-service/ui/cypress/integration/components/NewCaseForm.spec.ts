/* eslint-disable no-undef */
describe('New case form', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Can add full row to linelist', function () {
        cy.visit('/cases');
        cy.contains('No records to display');
        cy.seedLocation({
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });

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
        cy.get('div[data-testid="profession"]').type('Accountant');
        cy.get('li').first().should('contain', 'Accountant').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('Country');
        cy.get('li').first().should('contain', 'France').click();
        cy.get('input[name="confirmedDate"]').clear().type('2020-01-01');
        cy.get('div[data-testid="methodOfConfirmation"]').click();
        cy.get('li[data-value="PCR test"').click();
        cy.get('input[name="onsetSymptomsDate"]').clear().type('2020-01-02');
        cy.get('input[name="firstClinicalConsultationDate"]')
            .clear()
            .type('2020-01-03');
        cy.get('input[name="selfIsolationDate"]').clear().type('2020-01-04');
        cy.get('div[data-testid="admittedToHospital"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.get('input[name="hospitalAdmissionDate"]')
            .clear()
            .type('2020-01-05');
        cy.get('input[name="icuAdmissionDate"]').clear().type('2020-01-06');
        cy.get('div[data-testid="outcome"]').click();
        cy.get('li[data-value="Recovered"').click();
        cy.get('input[name="outcomeDate"]').clear().type('2020-01-07');
        cy.get('div[data-testid="symptoms"]').type('dry cough');
        cy.get('li').first().should('contain', 'dry cough').click();
        cy.get('div[data-testid="symptoms"]').type('mild fever');
        cy.get('li').first().should('contain', 'mild fever').click();
        cy.get('input[name="sourceUrl"]').clear().type('www.example.com');
        cy.get('textarea[name="notes"]')
            .clear()
            .type('test notes\non new line');
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
        cy.contains('Accountant');
        cy.contains('France');
        cy.contains('1/1/2020');
        cy.contains('dry cough, mild fever');
        cy.contains('www.example.com');
        cy.contains('test notes');
        cy.contains('on new line');
    });

    it('Can add minimal row to linelist', function () {
        cy.visit('/cases');
        cy.contains('No records to display');
        cy.seedLocation({
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });

        cy.visit('/cases/new');
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('Country');
        cy.get('li').first().should('contain', 'France').click();
        cy.get('input[name="confirmedDate"]').clear().type('2020-01-01');
        cy.get('input[name="sourceUrl"]').clear().type('www.example.com');
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');

        cy.visit('/cases');
        cy.contains('No records to display').should('not.exist');
        cy.contains('France');
        cy.contains('1/1/2020');
        cy.contains('www.example.com');
    });

    it('Does not add row on submission error', function () {
        // Avoid geolocation fail, the "Request failed" check below happens at the data service level.
        cy.seedLocation({
            name: 'France',
            geometry: { latitude: 42, longitude: 12 },
            country: 'France',
            geoResolution: 'Country',
        });
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/cases/new');
        cy.server();
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('Country');
        cy.get('li').first().should('contain', 'France').click();
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
        cy.get('div[data-testid="sex"]').click();
        cy.get('li[data-value="Female"').click();
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
