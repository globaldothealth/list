import enterSource from '../utils/enterSource';

/* eslint-disable no-undef */
describe('New case form', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    // Full case is covered in curator test.
    it('Can add minimal row to linelist', function () {
        cy.visit('/cases');
        cy.contains('No records to display');
        cy.seedLocation({
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });

        cy.get('button[title="Submit new case"]').click();
        enterSource('www.example.com');
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('Country');
        cy.get('li').contains('France').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.contains('Case added');

        cy.get('button[aria-label="close overlay"').click();
        cy.contains('No records to display').should('not.exist');
        cy.contains('www.example.com');
        cy.contains('France');
        cy.contains('1/1/2020');
    });

    it('Can submit events without dates', function () {
        cy.visit('/cases');
        cy.contains('No records to display');
        cy.seedLocation({
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });

        cy.get('button[title="Submit new case"]').click();
        enterSource('www.example.com');
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('Country');
        cy.get('li').contains('France').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        // Outcome without a date.
        cy.get('div[data-testid="outcome"]').click();
        cy.get('li[data-value="Recovered"').click();
        // Hospital admission without a date.
        cy.get('div[data-testid="admittedToHospital"]').click();
        cy.get('li[data-value="Yes"').click();
        // ICU admission without a date.
        cy.get('div[data-testid="admittedToIcu"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');

        cy.get('button[aria-label="close overlay"').click();
        cy.contains('No records to display').should('not.exist');
        cy.contains('www.example.com');
        cy.contains('France');
        cy.contains('1/1/2020');
        cy.contains('Yes');
        cy.contains('Recovered');
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

        cy.get('button[title="Submit new case"]').click();
        enterSource('www.example.com');
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('Country');
        cy.get('li').contains('France').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.server();
        // Force server to return error
        cy.route({
            method: 'POST',
            url: '/api/cases',
            status: 422,
            response: {},
        }).as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.contains('Request failed');

        cy.get('button[aria-label="close overlay"').click();
        cy.contains('No records to display');
    });

    it('Check for required fields', function () {
        cy.visit('/cases');
        cy.get('button[title="Submit new case"]').click();

        cy.get('p:contains("Required")').should('have.length', 3);
    });

    it('Shows checkbox on field completion', function () {
        cy.visit('/cases');
        cy.get('button[title="Submit new case"]').click();
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
        cy.get('div[data-testid="gender"]').click();
        cy.get('li[data-value="Female"').click();
        cy.get('svg[data-testid="check-icon"]').should('exist');
    });

    it('Shows error icon on field submission error', function () {
        cy.visit('/cases');
        cy.get('button[title="Submit new case"]').click();
        cy.get('svg[data-testid="error-icon"]').should('not.exist');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
        cy.get('input[name="confirmedDate"]').type('2020/02/31').blur();
        cy.get('svg[data-testid="error-icon"]').should('exist');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
    });
});
