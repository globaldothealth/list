/* eslint-disable no-undef */
describe('Alerts', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.login({ roles: ['curator'] });
    });

    it('clicking alert takes user to linelist filtered for uploadid', function () {
        cy.addSource('New source', 'www.example.com', [
            {
                _id: '5ef8e943dfe6e00030892d58',
                status: 'IN_PROGRESS',
                summary: { numCreated: 5, numUpdated: 3 },
                created: '2020-01-01',
            },
            {
                _id: '5ef8e943dfe6e00030892d59',
                status: 'SUCCESS',
                summary: { numCreated: 2 },
                created: '2020-01-02',
            },
        ]);
        cy.addCase({ uploadId: '5ef8e943dfe6e00030892d58', country: 'France' });
        cy.addCase({
            uploadId: '5ef8e943dfe6e00030892d59',
            country: 'United Kingdom',
        });
        cy.addCase({
            uploadId: '5ef8e943dfe6e00030892d60',
            country: 'Germany',
        });
        cy.visit('/');

        cy.get('button[aria-label="toggle alerts panel"').click();
        cy.contains('Please verify 5 cases added and 3 cases updated').click();
        cy.url().should('eq', 'http://localhost:3002/cases');
        cy.get('input[id="search-field"]').should(
            'have.value',
            'uploadid:5ef8e943dfe6e00030892d58',
        );
        cy.contains('France');
        cy.contains('United Kingdom').should('not.exist');
        cy.contains('Germany').should('not.exist');

        cy.contains('Please verify 2 cases added').click();
        cy.get('input[id="search-field"]').should(
            'have.value',
            'uploadid:5ef8e943dfe6e00030892d59',
        );
        cy.contains('France').should('not.exist');
        cy.contains('United Kingdom');
        cy.contains('Germany').should('not.exist');

        cy.contains('Linelist').click({ force: true });
        cy.get('input[id="search-field"]').should('have.value', '');
        cy.contains('France');
        cy.contains('United Kingdom');
        cy.contains('Germany');
    });
});
