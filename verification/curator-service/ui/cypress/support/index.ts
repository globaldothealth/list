import './commands';

// Before all tests have run, initialize the database. This removes all data,
// applies the schema and adds any indexes.
before(() => {
    cy.exec('npm run init-case-db');
    cy.exec('npm run init-sources-db');
    Cypress.Cookies.debug(true, { verbose: false });
});

// After all tests have run, seed database with initial data.
after(() => {
    cy.task('clearCasesDB', {});
    cy.task('clearSourcesDB', {});
    cy.task('clearUsersDB', {});
    cy.exec('npm run import-case-data');
});
