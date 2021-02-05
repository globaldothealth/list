/* eslint-disable no-undef */
describe('App', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
    });

    it('takes user to home page when home button is clicked', function () {
        cy.login();
        cy.visit('/cases');
        cy.url().should('eq', 'http://localhost:3002/cases');

        cy.contains('Charts');
        cy.contains('span', 'Charts').click();
        cy.url().should('eq', 'http://localhost:3002/');
    });

    it('Shows charts on home page', function () {
        cy.login();
        cy.visit('/');

        cy.contains('Completeness');
        cy.contains('Cumulative');
        cy.contains('Freshness');
    });

    it('Does not show charts on home page when logged-out', function () {
        cy.visit('/');

        cy.contains('Completeness').should('not.exist');
        cy.contains('Cumulative').should('not.exist');
        cy.contains('Freshness').should('not.exist');
    });

    it('shows logout button when logged in', function () {
        cy.login({ name: 'Alice Smith', email: 'alice@test.com', roles: [] });
        cy.visit('/');

        cy.get('button[data-testid="profile-menu"]').click();

        cy.contains('Logout');
        cy.contains('Profile');
    });

    it('Homepage with logged out user', function () {
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Charts').should('not.exist');
        cy.contains('Line list').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users').should('not.exist');

        cy.contains('Detailed line list data');
        cy.contains('Terms of use');
        cy.contains('Or sign in with email');
    });

    it('Homepage with logged in user with no roles', function () {
        cy.login({ roles: [] });
        cy.visit('/');

        // Readers-only are redirected to the line list.
        cy.url().should('eq', 'http://localhost:3002/cases');

        cy.contains('Create new').should('not.exist');
        cy.contains('Charts').should('not.exist');
        cy.contains('Line list');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users').should('not.exist');
        cy.contains('Terms of use');
    });

    it('Homepage with logged in admin', function () {
        cy.login({ roles: ['admin'] });
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Charts');
        cy.contains('Line list');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users');
        cy.contains('Terms of use');
    });

    it('Homepage with logged in curator', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.contains('Create new');
        cy.contains('Charts');
        cy.contains('Line list');
        cy.contains('Sources');
        cy.contains('Uploads');
        cy.contains('Manage users').should('not.exist');
        cy.contains('Terms of use');
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

    it('Can open new automated source modal from create new button', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New automated source').click();
        cy.contains('New automated data source');
        cy.url().should('eq', 'http://localhost:3002/sources/automated');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/');
    });

    it('Can open new automated backfill modal from create new button', function () {
        cy.login({ roles: ['curator'] });
        cy.visit('/');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New automated source backfill').click();
        cy.contains('New automated source backfill');
        cy.url().should('eq', 'http://localhost:3002/sources/backfill');
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

    it('Can navigate to terms of service', function () {
        cy.login();
        cy.visit('/');
        cy.contains('Line list');

        cy.contains('Global.health Terms of Use').should('not.exist');
        cy.contains('Terms of use').click({ force: true });
        cy.url().should('eq', 'http://localhost:3002/terms');
        cy.contains('Global.health Terms of Use');
    });

    it('Can navigate to home screen by clicking on logo', function () {
        cy.login();
        cy.visit('/cases');
        cy.contains('Line list');

        cy.get('a[data-testid="home-button"').click();
        cy.url().should('eq', 'http://localhost:3002/');

        cy.contains('Completeness').should('exist');
        cy.contains('Cumulative').should('exist');
        cy.contains('Freshness').should('exist');
    });
});
