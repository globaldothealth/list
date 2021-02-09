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
        cy.route('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.url().should('eq', 'http://localhost:3002/cases');
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.example.com');
            cy.contains('France');
            cy.contains('2020-01-01');
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
        cy.get('input[name="caseReference.sourceName"]').click();
        cy.get('input[name="caseReference.sourceName"]').type('New source');
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('li', 'France').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.server();
        cy.route('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.url().should('eq', 'http://localhost:3002/cases');
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.new-source.com');
            cy.contains('France');
            cy.contains('2020-01-01');

            cy.visit('/sources');
            cy.contains('www.new-source.com');
            cy.contains('New source');
        });
    });

    it('Can add multiple cases to linelist', function () {
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
        cy.get('input[name="numCases"]').clear().type('3');
        cy.server();
        cy.route('POST', '/api/cases?num_cases=3').as('addCases');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCases');
        cy.url().should('eq', 'http://localhost:3002/cases');
        cy.contains('3 cases added');
        cy.contains('No records to display').should('not.exist');
        cy.get('td:contains("www.example.com")').should('have.length', 3);
        cy.get('td:contains("2020-01-01")').should('have.length', 3);
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
        cy.route('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');

        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.example.com');
            cy.contains('France');
            cy.contains('2020-01-01');
            cy.contains('Recovered');
        });
    });

    it('Can submit with unknown fields', function () {
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
        cy.get('div[data-testid="gender"]').click();
        cy.get('li[data-value="Unknown"').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('li', 'France').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.get('div[data-testid="methodOfConfirmation"]').click();
        cy.get('li[data-value="Unknown"').click();
        cy.get('div[data-testid="admittedToHospital"]').click();
        cy.get('li[data-value="Unknown"').click();
        cy.get('div[data-testid="admittedToIcu"]').click();
        cy.get('li[data-value="Unknown"').click();
        cy.get('div[data-testid="outcome"]').click();
        cy.get('li[data-value="Unknown"').click();
        cy.get('div[data-testid="symptomsStatus"]').click();
        cy.get('li[data-value="Unknown"').click();
        cy.get('div[data-testid="hasPreexistingConditions"]').click();
        cy.get('li[data-value="Unknown"').click();
        cy.get('div[data-testid="traveledPrior30Days"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.get('button[data-testid="addTravelHistory"').click();
        cy.get('div[data-testid="travelHistory[0].purpose"]').click();
        cy.get('li[data-value="Unknown"').click();
        cy.get('div[data-testid="travelHistory[0].location"]').type('France');
        cy.contains('li', 'France').click();
        cy.server();
        cy.route('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.visit(`/cases/view/${resp.body.cases[0]._id}`);
            cy.contains('Unknown').should('not.exist');
        });
    });

    it('Can add fields from chips', function () {
        cy.seedLocation({
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });
        cy.addSource('Test source', 'www.example.com');
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
            occupation: 'Actor',
            transmissionPlaces: ['Gym', 'Hospital'],
            symptomStatus: 'Symptomatic',
            symptoms: [
                'fever',
                'cough',
                'anxiety',
                'apnea',
                'arthritis',
                'bleeding',
            ],
        });
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
            occupation: 'Horse trainer',
            transmissionPlaces: [
                'Airplane',
                'Factory',
                'Gym',
                'Hospital',
                'Hotel',
                'Office',
            ],
            symptomStatus: 'Symptomatic',
            symptoms: ['fever', 'cough'],
        });

        cy.visit('/cases/new');
        cy.contains('Create new COVID-19 line list case');
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('li', 'www.example.com').click();
        cy.contains('Actor');
        cy.contains('Horse trainer');
        cy.get('span:contains("Horse trainer")').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('li', 'France').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.get('div[data-testid="symptomsStatus"]').click();
        cy.get('li[data-value="Symptomatic"').click();
        cy.contains('fever');
        cy.contains('cough');
        cy.contains('anxiety');
        cy.contains('apnea');
        cy.contains('arthritis');
        cy.get('span:contains("fever")').click();
        cy.get('span:contains("anxiety")').click();
        cy.contains('Gym');
        cy.contains('Hospital');
        cy.contains('Airplane');
        cy.contains('Factory');
        cy.contains('Hotel');
        cy.get('span:contains("Gym")').click();
        cy.get('span:contains("Hospital")').click();
        cy.server();
        cy.route('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.visit(`/cases/view/${resp.body.cases[0]._id}`);
            cy.contains('Horse trainer');
            cy.contains('Actor').should('not.exist');
            cy.contains('fever');
            cy.contains('anxiety');
            cy.contains('cough').should('not.exist');
            cy.contains('Gym');
            cy.contains('Hospital');
            cy.contains('Factory').should('not.exist');
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
            url: '/api/cases?num_cases=1',
            status: 422,
            response: { message: 'nope' },
        }).as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.contains('nope');

        cy.get('button[aria-label="close overlay"').click();
        cy.contains('No records to display');
    });

    it('Can change source URL without changing source name', function () {
        cy.visit('/cases/new');

        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('li', 'www.example.com').click();
        cy.get('input[name="caseReference.sourceName"]').type('New source');
        cy.get('div[data-testid="caseReference"]').type('www.example.com2');
        cy.contains('li', 'www.example.com2').click();
        cy.get('input[name="caseReference.sourceName"]').should(
            'have.value',
            'New source',
        );
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
        cy.addSource('Test source', 'www.example.com');
        cy.visit('/cases/new');
        cy.contains('Create new COVID-19 line list case');
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('li', 'www.example.com').click();
        cy.get('button[id="add-location"]').click();
        cy.get('div[id="location.geoResolution"]').click();
        cy.contains('li', 'Admin3').click();
        cy.get('input[name="location.country"]').type('France');
        cy.get('input[name="location.name"]').type('Paris');
        cy.get('input[name="location.administrativeAreaLevel3"]').type('Paris');
        cy.get('input[name="location.geometry.latitude"]').type('12.34');
        cy.get('input[name="location.geometry.longitude"]').type('45.67');
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.server();
        cy.route('POST', '/api/cases?num_cases=1').as('addCase');
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
            cy.contains('2020-01-01');
        });
    });
});
