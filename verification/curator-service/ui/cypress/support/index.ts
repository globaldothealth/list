import './commands';

// Before all tests have run, initialize the database. This removes all data,
// applies the schema and adds any indexes.
before(() => {
    cy.exec('npm run init-db');
    Cypress.Cookies.debug(true, { verbose: false });
});

Cypress.on('uncaught:exception', (err, runnable, promise) => {
    if (promise) {
        return false;
    }
    // we still want to ensure there are no other unexpected
    // errors, so we let them fail the test
});

// After all tests have run, seed database with initial data.
after(() => {
    cy.task('clearCasesDB', {});
    cy.task('clearSourcesDB', {});
    cy.task('clearUsersDB', {});
    cy.exec('npm run import-case-data');
});
