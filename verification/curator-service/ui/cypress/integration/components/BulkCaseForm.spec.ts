/* eslint-disable no-undef */
describe('Bulk upload form', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.task('clearCasesDB', {});
        cy.login();
        cy.seedLocation({
            country: 'United Kingdom',
            admin1: 'England',
            admin2: 'Greater London',
            admin3: 'London',
            geometry: { latitude: 51.5072, longitude: -0.1275 },
            name: 'London, Greater London, England, United Kingdom',
            geoResolution: 'Admin3',
        });
        cy.seedLocation({
            country: 'Canada',
            admin1: 'Alberta',
            admin3: 'Banff',
            geometry: { latitude: 51.1784, longitude: 115.5708 },
            name: 'Banff, Alberta, Canada',
            geoResolution: 'Admin3',
        });
    });

    it('Can upload all fields', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('li', 'www.bulksource.com').click();
        const csvFixture = '../fixtures/bulk_data_with_all_fields.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);
        cy.server();
        cy.route('POST', '/api/cases/batchUpsert').as('batchUpsert');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        // Check that all relevant fields are visible.
        cy.contains('No records to display').should('not.exist');
        cy.contains(
            'bulk_data_with_all_fields.csv uploaded. 1 new case added.',
        );
        cy.server();
        cy.route('get', '/api/cases/*').as('viewCase');
        cy.get('[title="View this case details"]').click({ force: true });
        cy.wait('@viewCase');

        // Case data
        cy.contains('www.bulksource.com');
        cy.contains('sourceEntryId');
        cy.contains('superuser@test.com');

        // Demographics
        cy.contains('42-43');
        cy.contains('Male');

        // Location
        cy.contains('Admin3');
        cy.contains('London, Greater London, England, United Kingdom');

        // Events
        // Confirmed case date
        cy.contains('2020-06-23');
        // Hospital admission
        cy.contains('Yes');
        cy.contains('2020-06-22');
        // Outcome
        cy.contains('Recovered');
        cy.contains('2020-06-24');
    });

    it('Can upload CSV with existing source', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('li', 'www.bulksource.com').click();
        const csvFixture = '../fixtures/bulk_data.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);
        cy.server();
        cy.route('POST', '/api/cases/batchUpsert').as('batchUpsert');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        // Check data in linelist table.
        cy.contains('No records to display').should('not.exist');
        cy.contains('bulk_data.csv uploaded. 2 new cases added.');
        cy.contains('www.bulksource.com');
        cy.contains('Male');
        cy.contains('42');
        cy.contains('Canada');
        cy.contains('Alberta');
        cy.contains('Banff');
        cy.contains('th', 'Admitted to hospital')
            .invoke('index')
            .then((i) => {
                cy.get('td').eq(i).should('have.text', 'Yes');
            });
    });

    it('Can upload CSV with new source', function () {
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.new-source.com');
        cy.contains('li', 'www.new-source.com').click();
        cy.get('input[name="caseReference.sourceName"]').type('New source');
        const csvFixture = '../fixtures/bulk_data.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);
        cy.server();
        cy.route('POST', '/api/sources').as('addSource');
        cy.route('POST', '/api/cases/batchUpsert').as('batchUpsert');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addSource');
        cy.wait('@batchUpsert');

        // Check data in linelist table.
        cy.contains('No records to display').should('not.exist');
        cy.contains('bulk_data.csv uploaded. 2 new cases added.');
        cy.contains('www.new-source.com');
        cy.contains('Male');
        cy.contains('42');
        cy.contains('Canada');
        cy.contains('Alberta');
        cy.contains('Banff');
        cy.contains('th', 'Admitted to hospital')
            .invoke('index')
            .then((i) => {
                cy.get('td').eq(i).should('have.text', 'Yes');
            });

        cy.visit('/sources');
        cy.contains('www.new-source.com');
        cy.contains('New source');
    });

    it('Upserts data', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('li', 'www.bulksource.com').click();
        const csvFixture = '../fixtures/bulk_data.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);
        cy.server();
        cy.route('POST', '/api/cases/batchUpsert').as('batchUpsert');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        // Check data in linelist table.
        cy.contains('No records to display').should('not.exist');
        cy.contains('bulk_data.csv uploaded. 2 new cases added.');
        cy.contains('Male');
        cy.contains('Female').should('not.exist');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('li', 'www.bulksource.com').click();
        const updatedCsvFixture = '../fixtures/updated_bulk_data.csv';
        cy.get('input[type="file"]').attachFile(updatedCsvFixture);
        cy.server();
        cy.route('POST', '/api/cases/batchUpsert').as('batchUpsert');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        // The updated case now has a gender of Female.
        cy.contains('bulk_data.csv uploaded. 2 cases updated.');
        cy.contains('Female');
    });

    it('Upserts multiple cases if dictated by caseCount CSV field', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('li', 'www.bulksource.com').click();
        const csvFixture = '../fixtures/bulk_data_with_case_count.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);
        cy.server();
        cy.route('POST', '/api/cases/batchUpsert').as('batchUpsert');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');

        cy.contains(
            'bulk_data_with_case_count.csv uploaded. 3 new cases added.',
        );
        cy.get('tr').get('td:contains(Male)').should('have.length', 3);
    });

    it('Does not upload bad data and displays validation errors', function () {
        cy.addSource('Bulk source', 'www.bulksource.com');

        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.get('div[data-testid="caseReference"]').type('www.bulksource.com');
        cy.contains('li', 'www.bulksource.com').click();
        const csvFixture = '../fixtures/bad_bulk_data.csv';
        cy.get('input[type="file"]').attachFile(csvFixture);
        cy.server();
        cy.route('POST', '/api/cases/batchUpsert').as('batchUpsert');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@batchUpsert');
        cy.contains(
            'p',
            'The selected file could not be uploaded. Found 1 row(s) with errors.',
        );
        cy.get('ul').eq(1).get('li').should('contain', 'Row 1');
        cy.get('ul')
            .eq(1)
            .get('li')
            .children('ul')
            .first()
            .find('li')
            .should('have.length', 1)
            .should(
                'contain',
                'demographics.ageRange.start: Path `ageRange.start` (142) is more than maximum allowed value (120)',
            );
        cy.get('button[aria-label="close overlay"').click();

        cy.visit('/cases');
        cy.contains('No records to display');
    });
});
