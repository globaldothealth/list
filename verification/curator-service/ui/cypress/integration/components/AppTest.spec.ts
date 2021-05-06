/* eslint-disable no-undef */
describe('App', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
    });

    it('allows the user to search by date', function () {
        cy.login();

        cy.task('clearCasesDB', {});

        const countries: any = ['Germany', 'France', 'India', 'Italy'];
        const confirmedDate: any = [
            '2020-05-01',
            '2020-02-15',
            '2020-03-22',
            '2020-06-03',
        ];

        for (let i = 0; i < countries.length; i++) {
            cy.addCase({
                country: countries[i],
                notes: 'some notes',
                startConfirmedDate: confirmedDate[i],
            });
        }

        cy.visit('/cases');

        cy.get('.filter-button').click();
        cy.get('#dateconfirmedafter').type('2020-04-30');

        cy.get('body').then(($body) => {
            if ($body.find('.iubenda-cs-accept-btn').length) {
                cy.get('.iubenda-cs-accept-btn').click();
            }
        });

        cy.get('button[data-test-id="search-by-filter-button"]').click();

        cy.contains('2020-05-01');
        cy.contains('2020-06-03');
        cy.contains('2020-02-15').should('not.exist');
    });


    it('allows the user to search by nationality', function () {
        cy.login();
        cy.visit('/cases');


        cy.addCase({
            country: 'Russia',
            nationalities: ['American', 'Filipino', 'Polish'],
        });

        cy.get('.filter-button').click();
        cy.get('#nationality').type(
            'filipino',
        );
        cy.get('[data-test-id="search-by-filter-button"]').click();

        cy.contains('American, Filipino, Polish');
    });


    it('allows the user to search by variant', function () {
        cy.login();

        cy.addCase({
            country: 'Peru',
            variant: 'B.1.351',
            sourceUrl: 'www.variantb1351.com',
        });

        cy.visit('/cases');

        cy.get('.filter-button').click();
        cy.get('#variant').type('B.1.351{Enter}');

        cy.contains('www.variantb1351.com');
    });

    it('allows the user to search by date and an additional filter', function () {
        cy.login();

        const countries: any = ['Germany', 'France', 'India', 'Italy'];
        const confirmedDate: any = [
            '2020-05-01',
            '2020-02-15',
            '2020-03-22',
            '2020-06-03',
        ];

        for (let i = 0; i < countries.length; i++) {
            cy.addCase({
                country: countries[i],
                notes: 'some notes',
                startConfirmedDate: confirmedDate[i],
            });
        }

        cy.visit('/cases');
        
        cy.get('body').then(($body) => {
            if ($body.find('.iubenda-cs-accept-btn').length) {
                cy.get('.iubenda-cs-accept-btn').click();
            }
        });        cy.get('.filter-button').click();
        
        cy.get('#dateconfirmedafter').type('2020-04-30');
        cy.get('#country').type('italy{Enter}');

        cy.contains('2020-06-03');
        cy.contains('Italy');
        cy.contains('2020-02-15').should('not.exist');
        cy.contains('Germany').should('not.exist');
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

    it('Terms of Service link is right and has target _blank', function () {
        cy.login();
        cy.visit('/');
        cy.contains('Line list');

        cy.contains('Global.health Terms of Use').should('not.exist');
        cy.contains('Terms of use');
        cy.get('[data-testid="termsButton"]')
            .should('have.attr', 'href')
            .and('equal', 'https://global.health/terms-of-use');
        cy.get('[data-testid="termsButton"]').should(
            'have.attr',
            'target',
            '_blank',
        );
    });

    it('Privacy policy link is right and has target _blank', function () {
        cy.login();
        cy.visit('/');
        cy.contains('Line list');

        cy.contains('Terms of use');
        cy.get('[data-testid="privacypolicybutton"]')
            .should('have.attr', 'href')
            .and('equal', 'https://global.health/privacy/');
        cy.get('[data-testid="privacypolicybutton"]').should(
            'have.attr',
            'target',
            '_blank',
        );
    });

    it('The logo GH part links to the marketing website', function () {
        cy.login();
        cy.visit('/cases');
        cy.contains('Line list');

        cy.get('a[data-testid="home-button-gh"')
            .should('have.attr', 'href')
            .and('equal', 'https://global.health/');
    });

    it('The logo DATA part links to the data home', function () {
        cy.login();
        cy.visit('/cases');
        cy.contains('Line list');

        cy.get('a[data-testid="home-button-data"')
            .should('have.attr', 'href')
            .and('equal', '/');
    });
});