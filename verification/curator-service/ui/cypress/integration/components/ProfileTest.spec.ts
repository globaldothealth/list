/* eslint-disable no-undef */
describe('Profile', function () {
    it('Profile shows user information', function () {
        cy.login({
            name: 'Alice Smith',
            email: 'alice@test.com',
            roles: ['curator'],
        });
        cy.visit('/');
        cy.visit('/profile');

        cy.contains('Alice Smith');
        cy.contains('alice@test.com');
        cy.contains('curator');
    });

    // it('Checks if the change pass form is visible only for non-Google users', function () {
    //     cy.login({
    //         name: 'Alice Smith',
    //         email: 'alice@test.com',
    //         roles: ['curator'],
    //     });
    //     cy.visit('/')
    //     cy.visit('/profile');

    //     cy.contains('Alice Smith');
    //     cy.contains('alice@test.com');
    //     cy.contains('curator');
    // });

    it('Checks if the change pass form validation works well', function () {
        cy.login({
            name: 'Alice Smith',
            email: 'alice@test.com',
            roles: ['curator'],
            removeGoogleID: true,
        });
        cy.visit('/');
        cy.visit('/profile');

        cy.contains('Change your password');

        cy.get('#password').type('tsgasdgasd');
        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('one uppercase required!');
        cy.contains('Passwords must match');

        cy.get('#password').focus().clear();
        cy.get('#password').type('tsgasdgGasd');
        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('one number required!');

        cy.get('#password').focus().clear();
        cy.get('#password').type('tT$5');
        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('Minimum 8 characters required!');
    });
});
