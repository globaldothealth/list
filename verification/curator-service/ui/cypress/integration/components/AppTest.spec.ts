/* eslint-disable no-undef */
describe('App', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
    });

    it('takes user to home page when home button is clicked', function () {
        cy.login();
        cy.visit('/cases');
        cy.url().should('eq', 'http://localhost:3002/cases');

        cy.contains('Home');
        cy.contains('span', 'Home').click();
        cy.url().should('eq', 'http://localhost:3002/');
    });

    it('Shows charts on home page', function () {
        cy.visit('/');

        cy.contains('Completeness');
        cy.contains('Cumulative');
        cy.contains('Freshness');
    });

    it('shows login button when logged out', function () {
        cy.visit('/');

        cy.contains('Login');
    });

    it('shows logout button when logged in', function () {
        cy.login({ name: 'Alice Smith', email: 'alice@test.com', roles: [] });
        cy.visit('/');

        cy.contains('Logout alice@test.com');
    });

    it('Homepage with logged out user', function () {
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Home');
        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Profile').should('not.exist');
        cy.contains('Manage users').should('not.exist');
    });

    it('Homepage with logged in user with no roles', function () {
        cy.login({ roles: [] });
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Home');
        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Profile');
        cy.contains('Manage users').should('not.exist');
        cy.get('button[aria-label="toggle alerts panel"').should('not.exist');
    });

    it('Homepage with logged in admin', function () {
        cy.login({ roles: ['admin'] });
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Home');
        cy.contains('Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Profile');
        cy.contains('Manage users');
        cy.get('button[aria-label="toggle alerts panel"').should('not.exist');
    });

    it('Homepage with logged in curator', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.contains('Create new');
        cy.contains('Home');
        cy.contains('Linelist');
        cy.contains('Sources');
        cy.contains('Profile');
        cy.contains('Manage users').should('not.exist');
        cy.get('button[aria-label="toggle alerts panel"').should('exist');
    });

    it('Homepage with logged in reader', function () {
        cy.login({ roles: ['reader'] });
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Home');
        cy.contains('Linelist');
        cy.contains('Sources');
        cy.contains('Profile');
        cy.contains('Manage users').should('not.exist');
        cy.get('button[aria-label="toggle alerts panel"').should('not.exist');
    });

    it('Can open and close alerts panel', function () {
        cy.login({ roles: ['curator'] });
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
            {
                _id: '5ef8e943dfe6e00030892d59',
                status: 'SUCCESS',
                summary: { numUpdated: 3 },
                created: '2020-01-03',
            },
        ]);
        cy.visit('/');

        // Need to check for visibility since the popup is always in the DOM
        // but not always visible.
        cy.contains('Alerts').should('not.be.visible');
        cy.get('button[aria-label="toggle alerts panel"').click();
        cy.contains('Alerts').should('be.visible');
        cy.contains('Please verify 5 cases added and 3 cases updated').should(
            'be.visible',
        );
        cy.contains('2020-1-1').should('be.visible');
        cy.contains('Please verify 2 cases added').should('be.visible');
        cy.contains('2020-1-2').should('be.visible');
        cy.contains('Please verify 3 cases updated').should('be.visible');
        cy.contains('2020-1-3').should('be.visible');
        cy.get('button[aria-label="toggle alerts panel"').click();
        cy.contains('Alerts').should('not.be.visible');
    });

    it('Can open new case modal from create new button', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.contains('Create new COVID-19 line list case').should('not.exist');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New line list case').click();
        cy.contains('Create new COVID-19 line list case');
        cy.url().should('eq', 'http://localhost:3002/cases/new');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/');
    });

    it('Can open bulk upload modal from create new button', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.contains('New bulk upload');
        cy.url().should('eq', 'http://localhost:3002/cases/bulk');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/');
    });

    it('Closing modal shows previous page', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/sources');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New line list case').click();
        cy.url().should('eq', 'http://localhost:3002/cases/new');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/sources');
    });

    it('Closing modal navigates to /cases if there is no previous location', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/cases/new');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/cases');
    });
});
