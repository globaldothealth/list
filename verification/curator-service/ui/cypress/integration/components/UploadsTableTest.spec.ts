/* eslint-disable no-undef */
describe('Uploads table', function () {
    beforeEach(() => {
        cy.login();
        cy.task('clearSourcesDB', {});
    });

    it('displays uploads properly', function () {
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
        cy.visit('/uploads');
        cy.contains('www.example.com');
        cy.contains('5ef8e943dfe6e00030892d58');
        cy.contains('2020-1-1');
        cy.contains('IN_PROGRESS');
        cy.contains('5');
        cy.contains('3');
        cy.contains('5ef8e943dfe6e00030892d59');
        cy.contains('2020-1-2');
        cy.contains('SUCCESS');
        cy.contains('2');
        cy.contains('0');
    });

    it('can navigate to filtered linelist', function () {
        cy.addCase({ uploadId: '5ef8e943dfe6e00030892d58', country: 'France' });
        cy.addCase({
            uploadId: '5ef8e943dfe6e00030892d59',
            country: 'United Kingdom',
        });
        cy.addCase({
            uploadId: '5ef8e943dfe6e00030892d60',
            country: 'Germany',
        });
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
        cy.visit('/uploads');
        cy.contains('a', '5').click();
        cy.url().should('eq', 'http://localhost:3002/cases');
        cy.get('input[id="search-field"]').should(
            'have.value',
            'uploadid:5ef8e943dfe6e00030892d58',
        );
        cy.contains('France');
        cy.contains('United Kingdom').should('not.exist');
        cy.contains('Germany').should('not.exist');

        cy.visit('/uploads');
        cy.contains('a', '2').click();
        cy.url().should('eq', 'http://localhost:3002/cases');
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
