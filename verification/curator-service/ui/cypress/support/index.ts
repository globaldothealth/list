import './commands'

// After all tests have run, seed database with initial data.
after(() => {
    cy.task('clearDB', {});
    cy.exec('npm run import-data');
});