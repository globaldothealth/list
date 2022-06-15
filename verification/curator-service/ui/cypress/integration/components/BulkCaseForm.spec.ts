/* eslint-disable no-undef */
describe('Bulk upload form', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.task('clearCasesDB', {});
        cy.login();
        cy.seedLocation({
            country: 'UK',
            administrativeAreaLevel1: 'England',
            administrativeAreaLevel2: 'Greater London',
            administrativeAreaLevel3: 'London',
            geometry: { latitude: 51.5072, longitude: -0.1275 },
            name: 'London, Greater London, England, United Kingdom',
            geoResolution: 'Admin3',
        });
        cy.seedLocation({
            country: 'CA',
            administrativeAreaLevel1: 'Alberta',
            administrativeAreaLevel3: 'Banff',
            geometry: { latitude: 51.1784, longitude: 115.5708 },
            name: 'Banff, Alberta, Canada',
            geoResolution: 'Admin3',
        });
    });

    it('Can upload all fields', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('www.bulksource.com').click();
        const csvFixture = '../fixtures/bulk_data_with_all_fields.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);

        cy.intercept('POST', '/api/cases/batchUpsert').as('batchUpsert');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        // Check that all relevant fields are visible.
        cy.contains('No records to display').should('not.exist');
        cy.contains(
            'bulk_data_with_all_fields.csv uploaded. 1 new case added.',
        );

        cy.intercept('GET', '/api/cases/*').as('viewCase');

        cy.contains('td', 'Male').click({ force: true });
        cy.wait('@viewCase');

        // Case data
        cy.contains('www.bulksource.com');
        cy.contains('superuser@test.com');
        cy.contains('Data upload IDs')
            .parent()
            .parent()
            .contains(/[a-f\d]{24}/);
        cy.contains('VERIFIED');

        // Demographics
        cy.contains('41-45');
        cy.contains('Male');
        cy.contains('Accountant');
        cy.contains('Bangladeshi');
        cy.contains('British, Indian');

        // Location
        cy.contains('London, Greater London, England, United Kingdom');
        cy.contains('Admin3');

        // Events
        // Confirmation
        cy.contains('2020-06-23');
        cy.contains('PCR test');
        // Symptom onset
        cy.contains('2020-06-19');
        // Hospital admission
        cy.contains('Yes');
        cy.contains('2020-06-21');
        // ICU admission
        cy.contains('2020-06-22');
        // Outcome
        cy.contains('Recovered');
        cy.contains('2020-06-24');

        // Symptoms
        cy.contains('Symptomatic');
        cy.contains('cough, fever');

        // Preexisting conditions
        cy.contains('Yes');
        cy.contains('Lyme disease, COPD');
    });

    it('Can upload CSV with existing source', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('www.bulksource.com').click();
        const csvFixture = '../fixtures/bulk_data.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);

        cy.intercept('POST', '/api/cases/batchUpsert').as('batchUpsert');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        // Check data in linelist table.
        cy.contains('No records to display').should('not.exist');
        cy.contains('bulk_data.csv uploaded. 2 new cases added.');
        cy.contains('www.bulksource.com');
        cy.contains('2020-06-23');
        cy.contains('Canada');
        cy.contains('Alberta');
        cy.contains('Banff');
        cy.contains('Male');
        cy.contains('41-45');
    });

    it('Can upload CSV with new source', function () {
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.new-source.com');
        cy.contains('www.new-source.com').click();
        cy.get('input[name="caseReference.sourceName"]').type('New source');
        cy.get('input[name="caseReference.sourceLicense"]').type('GPL3');
        const csvFixture = '../fixtures/bulk_data.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);

        cy.intercept('POST', '/api/sources').as('addSource');
        cy.intercept('POST', '/api/cases/batchUpsert').as('batchUpsert');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addSource');
        cy.wait('@batchUpsert');

        // Check data in linelist table.
        cy.contains('No records to display').should('not.exist');
        cy.contains('bulk_data.csv uploaded. 2 new cases added.');
        cy.contains('www.new-source.com');
        cy.contains('2020-06-23');
        cy.contains('Canada');
        cy.contains('Alberta');
        cy.contains('Banff');
        cy.contains('Male');
        cy.contains('41-45');

        cy.visit('/sources');
        cy.contains('www.new-source.com');
        cy.contains('New source');
    });

    it('Upserts data', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('www.bulksource.com').click();
        const csvFixture = '../fixtures/bulk_data.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);

        cy.intercept('POST', '/api/cases/batchUpsert').as('batchUpsert');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        // Check data in linelist table.
        cy.contains('No records to display').should('not.exist');
        cy.contains('bulk_data.csv uploaded. 2 new cases added.');
        cy.contains('Male');
        cy.contains('Female').should('not.exist');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('www.bulksource.com').click();
        const updatedCsvFixture = '../fixtures/updated_bulk_data.csv';
        cy.get('input[type="file"]').attachFile(updatedCsvFixture);

        cy.intercept('POST', '/api/cases/batchUpsert').as('batchUpsert');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        // One case was updated to have a gender of Female.
        // The other case, while present, wasn't modified.
        // However the data service thinks it updated both: see #NNNN
        // to see why this won't be a big deal in the long run.
        cy.contains('bulk_data.csv uploaded. 2 cases updated.');
        cy.contains('Female');

        // Check both upload ids are present
        cy.intercept('get', '/api/cases/*').as('viewCase');

        cy.contains('td', 'Female').click({ force: true });
        cy.wait('@viewCase');
        cy.contains('Data upload IDs')
            .parent()
            .parent()
            .contains(/[a-f\d]{24}, [a-f\d]{24}/);
    });

    it('Upserts multiple cases if dictated by caseCount CSV field', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('www.bulksource.com').click();
        const csvFixture = '../fixtures/bulk_data_with_case_count.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);

        cy.intercept('POST', '/api/cases/batchUpsert').as('batchUpsert');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        cy.contains(
            'bulk_data_with_case_count.csv uploaded. 3 new cases added.',
        );
        cy.get('tr').get('td:contains(Male)').should('have.length', 3);
    });

    it('Does not upload bad data and displays validation errors', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('www.bulksource.com').click();
        const csvFixture = '../fixtures/bad_bulk_data.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);

        cy.intercept('POST', '/api/cases/batchUpsert').as('batchUpsert');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');
        cy.contains(
            'p',
            'The selected file could not be uploaded. Found 1 row(s) with errors.',
        );
        cy.get('ul').eq(3).should('contain', 'Row 1');
        cy.get('ul')
            .eq(3)
            .should('have.length', 1)
            .should(
                'contain',
                'age range 142-42 invalid',
            );
        cy.get('button[aria-label="close overlay"').click();

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');
    });

    it('Fails gracefully when no header in CSV', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('www.bulksource.com').click();
        const csvFixture = '../fixtures/no_header.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);

        cy.intercept('POST', '/api/cases/batchUpsert').as('batchUpsert');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');
        cy.contains('location.query must be specified to be able to geocode');
        cy.get('button[aria-label="close overlay"').click();

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');
    });
});
