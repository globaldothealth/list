describe('<AcknowledgmentsPage />', function () {
    // Array has to have type any due to spec files
    // detecting arrays as objects
    const countries: any = [
        'Argentina',
        'Brazil',
        'Canada',
        'China',
        'Germany',
        'Spain',
        'Peru',
        'Poland',
        'United Kingdom',
        'USA',
    ];

    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });

        for (let i = 0; i < 10; i++) {
            cy.addSource(
                countries[i],
                'https://test.com',
                countries[i],
                'https://test.com',
            );
        }
    });

    it('Should display loading indicator', function () {
        cy.server();
        cy.route({
            method: 'GET',
            url: `/api/acknowledgment-sources`,
            status: 200,
            response: 'fixture:acknowledgment_data.json',
            delay: 3000,
        }).as('fetchSources');
        cy.visit('/data-acknowledgments');
        cy.contains(/Data Acknowledgments/i);
        //tmp solution
        cy.visit('/data-acknowledgments');

        cy.get('[data-cy="loader"]').should('be.visible');
        cy.wait('@fetchSources');
        cy.get('[data-cy="loader"]').should('not.be.visible');
    });

    it('Can change number of rows per page', function () {
        cy.server();
        cy.route({
            method: 'GET',
            url: '/api/acknowledgment-sources',
        }).as('fetchSources');

        cy.visit('/data-acknowledgments');
        cy.wait('@fetchSources');

        for (let i = 0; i < 10; i++) {
            cy.contains(countries[i]).should('be.visible');
        }

        cy.get('.MuiSelect-select.MuiTablePagination-select').click();
        cy.get('[data-value=5]').click();

        for (let i = 0; i < 10; i++) {
            if (i < 5) {
                cy.contains(countries[i]).should('be.visible');
            } else {
                cy.contains(countries[i]).should('not.be.visible');
            }
        }
    });

    it('Can sort', function () {
        cy.server();
        cy.route({
            method: 'GET',
            url: `/api/acknowledgment-sources`,
        }).as('fetchSources');

        cy.visit('/data-acknowledgments');
        cy.wait('@fetchSources');

        cy.get('.MuiSelect-select.MuiTablePagination-select').click();
        cy.get('[data-value=5]').click();

        // Sort sources
        cy.contains(/Provider name/i).click();

        for (let i = countries.length - 1; i >= 0; i--) {
            if (i >= 5) {
                cy.contains(countries[i]).should('be.visible');
            } else {
                cy.contains(countries[i]).should('not.be.visible');
            }
        }
    });

    it('Can toggle between pages', function () {
        cy.server();
        cy.route({
            method: 'GET',
            url: `/api/acknowledgment-sources`,
        }).as('fetchSources');

        cy.visit('/data-acknowledgments');
        cy.wait('@fetchSources');

        cy.get('.MuiSelect-select.MuiTablePagination-select').click();
        cy.get('[data-value=5]').click();

        // Only first 5 sources should be visible
        for (let i = 0; i < 10; i++) {
            if (i < 5) {
                cy.contains(countries[i]).should('be.visible');
            } else {
                cy.contains(countries[i]).should('not.be.visible');
            }
        }

        // Go to the next page
        cy.get('[aria-label="Next page"]').click();

        // Only last 5 sources should be visible
        for (let i = 0; i < 10; i++) {
            if (i < 5) {
                cy.contains(countries[i]).should('not.be.visible');
            } else {
                cy.contains(countries[i]).should('be.visible');
            }
        }
    });
});
