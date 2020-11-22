/* eslint-disable no-undef */
describe('Linelist table', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login({
            email: 'test@bar.com',
            name: 'test',
            roles: ['admin', 'curator'],
        });
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Display case properly', function () {
        cy.addCase({
            country: 'France',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('www.example.com');
    });

    it('Can open and close the edit modal', function () {
        cy.addCase({
            country: 'France',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('Edit case').should('not.exist');
        cy.get('button[data-testid="row menu"]').click();
        cy.contains('li', 'Edit').click();
        cy.contains('Edit case');
        cy.get('button[aria-label="close overlay"').click();
        cy.contains('Edit case').should('not.exist');
    });

    it('Can open and close the details modal', function () {
        cy.addCase({
            country: 'France',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('France');
        cy.contains(/View case\b/).should('not.exist');
        cy.contains('td', 'France').click({ force: true });
        cy.contains(/View case\b/);
        cy.get('button[aria-label="close overlay"').click();
        cy.contains(/View case\b/).should('not.exist');
    });

    it('Can delete a case', function () {
        cy.addCase({
            country: 'France',
            sourceUrl: 'www.example.com',
        });
        cy.visit('/cases');
        cy.contains('France');

        cy.get('button[data-testid="row menu"]').click();
        cy.contains('li', 'Delete').click();
        cy.contains('Are you sure you want to delete this case?');
        cy.contains('Yes').click();

        cy.contains('France').should('not.exist');
    });

    it('Can delete multiple cases', function () {
        cy.addCase({
            country: 'France',
        });
        cy.addCase({
            country: 'Germany',
        });
        cy.addCase({
            country: 'United Kingdom',
        });
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('Germany');
        cy.contains('United Kingdom');

        // Three row checkboxes and a header checkbox
        cy.get('input[type="checkbox"]').should('have.length', 4);
        cy.get('input[type="checkbox"]').eq(1).click();
        cy.get('input[type="checkbox"]').eq(3).click();
        cy.server();
        cy.route('DELETE', `/api/cases`).as('deleteCases');
        cy.get('button[title="Delete selected rows"]').click();
        cy.contains('Are you sure you want to delete 2 cases?');
        cy.contains('Yes').click();
        cy.wait('@deleteCases');

        cy.contains('France').should('not.exist');
        cy.contains('Germany');
        cy.contains('United Kingdom').should('not.exist');
    });

    it('Can toggle case verification status', function () {
        cy.addCase({
            country: 'France',
        });
        cy.addCase({
            country: 'France',
        });
        cy.addCase({
            country: 'France',
        });
        cy.visit('/cases');
        cy.get('[data-testid="unverified-svg"]').should('have.length', 3);
        cy.server();
        cy.route('POST', `/api/cases/batchUpdate`).as('updateCases');

        // Three row checkboxes and a header checkbox
        cy.get('input[type="checkbox"]').should('have.length', 4);

        // Select all rows.
        cy.get('input[type="checkbox"]').eq(0).click();

        // Mark them verified.
        cy.get('button[title="Verify selected rows"]').click();
        cy.wait('@updateCases');
        cy.get('[data-testid="verified-svg"]').should('have.length', 3);

        // Select all rows.
        cy.get('input[type="checkbox"]').eq(0).click();

        // Mark them unverified.
        cy.get('button[title="Unverify selected rows"]').click();
        cy.wait('@updateCases');
        cy.get('[data-testid="unverified-svg"]').should('have.length', 3);
    });

    it('Can toggle case verification status for rows across pages', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
            });
        }
        cy.addCase({
            country: 'Germany',
        });
        cy.addCase({
            country: 'United Kingdom',
        });
        cy.server();
        cy.route('GET', '/api/cases/*').as('getCases');
        cy.visit('/cases');
        cy.wait('@getCases');
        cy.get('[data-testid="unverified-svg"]').should('have.length', 9);
        cy.contains('rows').click();
        cy.get('li').contains('5').click();
        cy.wait('@getCases');
        cy.contains('Filter').click();
        cy.get('li').contains('country').click();
        cy.get('input[id="search-field"]').type('France{enter}');
        cy.wait('@getCases');

        cy.get('input[type="checkbox"]').eq(0).click();
        cy.contains('Select all 7 rows').click();

        // Mark them verified.
        cy.route('POST', `/api/cases/batchUpdateQuery`).as('updateCases');
        cy.get('button[title="Verify selected rows"]').click();
        cy.wait('@updateCases');
        cy.wait('@getCases');
        cy.get('input[id="search-field"]').clear().type('{enter}');
        cy.wait('@getCases');
        cy.contains('rows').click();

        // Check only France rows are changed
        cy.get('li').contains('10').click();
        cy.wait('@getCases');
        cy.get('[data-testid="verified-svg"]').should('have.length', 7);
        cy.get('[data-testid="unverified-svg"]').should('have.length', 2);

        cy.contains('rows').click();
        cy.get('li').contains('5').click();
        cy.wait('@getCases');
        cy.contains('Filter').click();
        cy.get('li').contains('country').click();
        cy.get('input[id="search-field"]').type('France{enter}');
        cy.wait('@getCases');
        cy.get('input[type="checkbox"]').eq(0).click();
        cy.contains('Select all 7 rows').click();

        // Mark them unverified.
        cy.get('button[title="Unverify selected rows"]').click();
        cy.wait('@updateCases');
        cy.wait('@getCases');
        cy.get('input[id="search-field"]').clear().type('{enter}');
        cy.wait('@getCases');
        cy.contains('rows').click();
        cy.get('li').contains('10').click();
        cy.wait('@getCases');
        cy.get('[data-testid="verified-svg"]').should('not.exist');
        cy.get('[data-testid="unverified-svg"]').should('have.length', 9);
    });

    it('displays search errors', function () {
        cy.visit('/cases');
        cy.contains('Filter').click();
        cy.get('li').contains('country').click();
        cy.get('input[id="search-field"]').type('{enter}');
        cy.contains(/Invalid search query/);
    });

    it('Can search', function () {
        cy.addCase({
            country: 'France',
        });
        cy.addCase({
            country: 'Germany',
        });
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('Germany');
        cy.contains('Filter').click();
        cy.get('li').contains('country').click();
        cy.get('input[id="search-field"]').type('uruguay{enter}');
        cy.contains('France').should('not.exist');
        cy.contains('Germany').should('not.exist');
        cy.get('input[id="search-field"]').clear().type('France{enter}');
        cy.get('td[value="France"]');
        cy.contains('Germany').should('not.exist');
        cy.get('button[aria-label="clear search"]').click();
        cy.contains('France');
        cy.contains('Germany');
    });

    it('Search query is saved in browser history', function () {
        cy.addCase({
            country: 'France',
        });
        cy.addCase({
            country: 'United Kingdom',
        });
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('United Kingdom');
        cy.contains('Filter').click();
        cy.get('li').contains('country').click();
        cy.get('input[id="search-field"]').type('France{enter}');
        cy.contains('United Kingdom').should('not.exist');

        // Navigate to case details and back
        cy.get('td[value="France"]').click();
        cy.contains(/View case\b/);
        cy.get('button[aria-label="close overlay"').click();
        cy.contains(/View case\b/).should('not.exist');

        // Search is maintained
        cy.get('input[id="search-field"]').should(
            'have.value',
            'country:France',
        );
        cy.get('td[value="France"]');
        cy.contains('United Kingdom').should('not.exist');
    });

    it('Can select all rows across pages only after searching', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
                notes: 'some notes',
                sourceUrl: 'foo.bar',
            });
        }
        cy.server();
        cy.route('GET', '/api/cases/*').as('getCases');
        cy.visit('/cases');
        cy.wait('@getCases');
        cy.contains('rows').click();
        cy.route('GET', '/api/cases/?limit=5&page=1').as('get5Cases');
        cy.get('li').contains('5').click();
        cy.wait('@get5Cases');
        cy.get('input[type="checkbox"]').should('have.length', 6);
        cy.contains('1 row selected').should('not.exist');
        cy.get('input[type="checkbox"]').eq(1).click();
        cy.contains('1 row selected');
        cy.get('input[type="checkbox"]').eq(0).click();
        cy.contains('5 rows selected');

        // Select all option not available before search
        cy.contains('Select all 7 rows').should('not.exist');

        cy.contains('Filter').click();
        cy.get('li').contains('country').click();
        cy.get('input[id="search-field"]').type('France{enter}');

        // Select all option available after search
        cy.get('input[type="checkbox"]').eq(0).click();
        cy.contains('Select all 7 rows').click();
        cy.contains('7 rows selected');

        cy.contains('Unselect all 7 rows').click();
        cy.contains('7 rows selected').should('not.exist');
    });

    it('Can delete all cases across rows for a search result', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
            });
        }
        cy.addCase({
            country: 'Germany',
        });
        cy.addCase({
            country: 'United Kingdom',
        });
        cy.server();
        cy.route('GET', '/api/cases/*').as('getCases');
        cy.visit('/cases');
        cy.wait('@getCases');
        cy.contains('rows').click();
        cy.get('li').contains('5').click();
        cy.contains('Filter').click();
        cy.get('li').contains('country').click();
        cy.get('input[id="search-field"]').type('France{enter}');
        cy.get('input[type="checkbox"]').eq(0).click();
        cy.contains('Select all 7 rows').click();
        cy.server();
        cy.route('DELETE', `/api/cases`).as('deleteCases');
        cy.get('button[title="Delete selected rows"]').click();
        cy.contains('Are you sure you want to delete 7 cases?');
        cy.contains('Yes').click();
        cy.wait('@deleteCases');

        cy.contains('No records to display');
        cy.get('input[id="search-field"]').clear().type('{enter}');
        cy.contains('France').should('not.exist');
        cy.contains('Germany');
        cy.contains('United Kingdom');
    });

    it('Pagination settings stays the same after returning from details modal', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
                notes: 'some notes',
                sourceUrl: 'foo.bar',
            });
        }
        cy.server();
        cy.route('GET', '/api/cases/*').as('getCases');
        cy.visit('/cases');
        cy.wait('@getCases');
        cy.contains('rows').click();
        cy.route('GET', '/api/cases/?limit=5&page=1').as('getFirstPage');
        cy.get('li').contains('5').click();
        cy.wait('@getFirstPage');

        cy.contains('chevron_right').click();
        cy.contains('td', 'France').first().click({ force: true });
        cy.get('button[aria-label="close overlay"').click();

        cy.contains('6-7 of 7').should('exist');
        cy.contains('5 rows').should('exist');
    });

    it('Searching from a different page than first flips back to page one', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
                notes: 'some notes',
                sourceUrl: 'foo.bar',
            });
        }
        cy.server();
        cy.route('GET', '/api/cases/*').as('getCases');
        cy.visit('/cases');
        cy.wait('@getCases');
        cy.contains('rows').click();
        cy.route('GET', '/api/cases/?limit=5&page=1').as('getFirstPage');
        cy.get('li').contains('5').click();
        cy.wait('@getFirstPage');

        cy.contains('chevron_right').click();

        cy.get('input[id="search-field"]').type('France{enter}');

        cy.contains('1-5 of 7').should('exist');
    });
});
