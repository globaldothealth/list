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
});
