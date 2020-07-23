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
    it('Can add minimal row to linelist with existing source', function () {
        cy.seedLocation({
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });
        cy.addSource('Test source', 'www.example.com');

        cy.visit('/cases/new');
        cy.contains('Create new COVID-19 line list case');
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('li', 'www.example.com').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('li', 'France').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.url().should('eq', 'http://localhost:3002/cases');
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.example.com');
            cy.contains('France');
            cy.contains('1/1/2020');
        });
    });

    it('Can add minimal row to linelist with new source', function () {
        cy.seedLocation({
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });

        cy.visit('/cases/new');
        cy.contains('Create new COVID-19 line list case');
        cy.get('div[data-testid="caseReference"]').type('www.new-source.com');
        cy.contains('li', 'www.new-source.com').click();
        cy.get('input[name="caseReference.sourceName"]').type('New source');
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('li', 'France').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.url().should('eq', 'http://localhost:3002/cases');
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.new-source.com');
            cy.contains('France');
            cy.contains('1/1/2020');

            cy.visit('/sources');
            cy.contains('www.new-source.com');
            cy.contains('New source');
        });
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
        cy.addSource('Test source', 'www.example.com');

        cy.visit('/cases/new');
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('li', 'www.example.com').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('li', 'France').click();
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

        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.example.com');
            cy.contains('France');
            cy.contains('1/1/2020');
            cy.contains('Yes');
            cy.contains('Recovered');
        });
    });

    it('Does not add row on submission error', function () {
        // Avoid geolocation fail, the "Request failed" check below happens at the data service level.
        cy.seedLocation({
            name: 'France',
            geometry: { latitude: 42, longitude: 12 },
            country: 'France',
            geoResolution: 'Country',
        });
        cy.addSource('Test source', 'www.example.com');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/cases/new');
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('li', 'www.example.com').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('li', 'France').click();
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
        cy.visit('/cases/new');

        cy.get('p:contains("Required")').should('have.length', 3);
    });

    it('Shows checkbox on field completion', function () {
        cy.visit('/cases/new');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
        cy.get('div[data-testid="gender"]').click();
        cy.get('li[data-value="Other"').click();
        cy.get('svg[data-testid="check-icon"]').should('exist');
    });

    it('Shows error icon on field submission error', function () {
        cy.visit('/cases/new');
        cy.get('svg[data-testid="error-icon"]').should('not.exist');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
        cy.get('input[name="confirmedDate"]').type('2020/02/31').blur();
        cy.get('svg[data-testid="error-icon"]').should('exist');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
    });

    it('Can specify geocode manually', function () {
        cy.visit('/cases/new');
        cy.contains('Create new COVID-19 line list case');
        enterSource('www.example.com');
        cy.get('button[id="add-location"]').click();
        cy.get('div[id="location.geoResolution"]').click();
        cy.contains('li', 'Admin3').click();
        cy.get('input[name="location.country"]').type('France');
        cy.get('input[name="location.name"]').type('Paris');
        cy.get('input[name="location.geometry.latitude"]').type('12.34');
        cy.get('input[name="location.geometry.longitude"]').type('45.67');
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.url().should('eq', 'http://localhost:3002/cases');
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.example.com');
            cy.contains('France');
            cy.contains('Paris');
            cy.contains('1/1/2020');
        });
    });
});
