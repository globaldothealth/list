import { getDefaultQuery } from '../../utils/helperFunctions';
import { Outcome } from '../../support/commands';

/* eslint-disable no-undef */
describe('App', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
    });

    it('allows the user to search by date', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });

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

        cy.visit('/');
        cy.contains('Line list').click();

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
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');
        cy.contains('Line list').click();

        cy.addCase({
            country: 'Russia',
            nationalities: ['American', 'Filipino', 'Polish'],
        });

        cy.get('.filter-button').click();
        cy.get('#nationality').type('filipino');
        cy.get('[data-test-id="search-by-filter-button"]').click();

        cy.contains('American, Filipino, Polish');
    });

    it('allows the user to search by variant', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');
        cy.contains('Line list').click();

        cy.addCase({
            country: 'Peru',
            variant: 'B.1.351',
            sourceUrl: 'www.variantb1351.com',
        });

        cy.contains('Line list').click();

        cy.get('.filter-button').click();
        cy.get('#variant').type('B.1.351{Enter}');

        cy.contains('www.variantb1351.com');
    });

    it('allows the user to search by not provided gender', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.task('clearCasesDB', {});

        const genders: any = ['Male', 'Female', 'Female', '', 'Female'];
        const countries: any = [
            'Germany',
            'Poland',
            'Russia',
            'Italy',
            'Spain',
        ];

        for (let i = 0; i < countries.length; i++) {
            cy.addCase({
                country: countries[i],
                gender: genders[i] === '' ? undefined : genders[i],
            });
        }

        cy.intercept(
            'GET',
            getDefaultQuery({ query: 'gender:notProvided' }),
        ).as('filterByGender');

        console.log(getDefaultQuery({ query: 'gender:notProvided' }));

        cy.visit('/');
        cy.contains('Line list').click();

        cy.contains('Germany').should('be.visible');
        cy.contains('Italy').should('be.visible');

        cy.get('.filter-button').click();
        cy.get('#gender').click();
        cy.contains('Not provided').click();
        cy.get('[data-test-id="search-by-filter-button"]').click();

        cy.wait('@filterByGender');

        cy.contains('Italy').should('be.visible');
        cy.contains('Germany').should('not.exist');
    });

    it('allows the user to search by outcome', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');
        cy.contains('Line list').click();

        cy.addCase({
            country: 'Peru',
            outcome: Outcome.Recovered,
            sourceUrl: 'www.recovered.com',
        });

        cy.contains('Line list').click();

        cy.get('.filter-button').click();
        cy.get('#outcome').click();
        cy.get('[data-value="Recovered"]').click();
        cy.get('[data-test-id="search-by-filter-button"]').click();

        cy.contains('www.recovered.com');
    });

    it('allows the user to search by date and an additional filter', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');
        cy.contains('Line list').click();

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

        cy.contains('Line list').click();

        cy.get('body').then(($body) => {
            if ($body.find('.iubenda-cs-accept-btn').length) {
                cy.get('.iubenda-cs-accept-btn').click();
            }
        });
        cy.get('.filter-button').click();

        cy.get('#dateconfirmedafter').type('2020-04-30');
        cy.get('#country').click();
        cy.get('[data-value="IT"]').click();
        cy.get('#start-filtering').click();

        cy.contains('2020-06-03');
        cy.contains('Italy');
        cy.contains('2020-02-15').should('not.exist');
        cy.contains('Germany').should('not.exist');
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
        cy.contains('Or sign up with Google');
    });

    it('Homepage with logged in user with no roles', function () {
        cy.login({ name: 'Alice Smith', email: 'alice@test.com', roles: [] });
        cy.visit('/');

        // Readers-only are redirected to the line list.
        cy.url().should('eq', 'http://localhost:3002/cases');

        cy.contains('Create new').should('not.exist');
        cy.contains('Charts').should('not.exist');
        cy.contains('COVID-19 Linelist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users').should('not.exist');
        cy.contains('Terms of use');
    });

    it('Can open new case modal from create new button', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');

        cy.contains('Create new COVID-19 line list case').should('not.exist');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New line list case').click();
        cy.contains('Create new COVID-19 line list case');
        cy.url().should('eq', 'http://localhost:3002/cases/new');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/cases');
    });

    it('Can open bulk upload modal from create new button', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New bulk upload').click();
        cy.contains('New bulk upload');
        cy.url().should('eq', 'http://localhost:3002/cases/bulk');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/cases');
    });

    it('Can open new automated source modal from create new button', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New automated source').click();
        cy.contains('New automated data source');
        cy.url().should('eq', 'http://localhost:3002/sources/automated');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/cases');
    });

    it('Can open new automated backfill modal from create new button', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New automated source backfill').click();
        cy.contains('New automated source backfill');
        cy.url().should('eq', 'http://localhost:3002/sources/backfill');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/cases');
    });

    it('Closing modal shows previous page', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');
        cy.contains('Sources').click();
        cy.url().should('eq', 'http://localhost:3002/sources');

        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New line list case').click();
        cy.url().should('eq', 'http://localhost:3002/cases/new');
        cy.get('button[aria-label="close overlay"').click();
        cy.url().should('eq', 'http://localhost:3002/sources');
    });

    it('Closing modal navigates to /cases if there is no previous location', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');
        cy.contains('Line list').click();
        cy.url().should('eq', 'http://localhost:3002/cases');

        cy.contains(/create new/i).click();
        cy.contains(/new line list case/i).click();
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

        cy.get('#popup-small-screens').should('not.exist');

        cy.get('a[data-testid="home-button-data"')
            .should('have.attr', 'href')
            .and('equal', '/');
    });

    it('Displays popup on small devices', () => {
        cy.viewport(520, 780);
        cy.login();
        cy.visit('/cases');

        cy.get('#popup-small-screens').contains(
            'For a better experience please visit this website using a device with a larger screen',
        );

        cy.get('#small-screens-popup-close-btn').click();
        cy.get('#popup-small-screens').should('not.exist');
    });

    it('Displays version number in profile menu', function () {
        cy.login({ name: 'Alice Smith', email: 'alice@test.com', roles: [] });

        cy.intercept('GET', '/version', '1.10.1').as('fetchVersion');

        cy.visit('/');
        cy.wait('@fetchVersion');

        cy.get('button[data-testid="profile-menu"]').click();

        cy.contains('Version: 1.10.1');
    });
});
