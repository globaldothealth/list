import enterSource from '../utils/enterSource';

/* eslint-disable no-undef */
describe('Bulk upload form', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.task('clearCasesDB', {});
        cy.login();
        cy.seedLocation({
            country: 'Canada',
            admin1: 'Alberta',
            admin3: 'Banff',
            geometry: { latitude: 51.1784, longitude: 115.5708 },
            name: 'Banff, Alberta, Canada',
            geoResolution: 'Admin3',
        });
    });

    // TODO: Test more fields here via the case details UI.
    it('Can upload CSV', function () {
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        enterSource('www.bulksource.com');
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

    it('Upserts data', function () {
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        enterSource('www.bulksource.com');
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
        enterSource('www.bulksource.com', true);
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
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        enterSource('www.bulksource.com');
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
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        enterSource('www.bulksource.com');
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
