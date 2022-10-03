describe('LandingPage', function () {
    it('The landing page shows two ways of login', function () {
        cy.visit('/');
        cy.contains('Welcome to G.h Data.');
        cy.contains('Sign up form');
        cy.contains('Already have an account?');

        cy.get('button[data-testid="sign-up-button"]').should('be.visible');
        cy.get('button[data-testid="sign-up-button"]')
            .should('have.attr', 'type')
            .and('equal', 'submit');
    });

    it('The forgot password modal appears and validates email address', function () {
        cy.visit('/');
        cy.contains('Welcome to G.h Data.');
        cy.contains('Sign in!').click();

        cy.contains('Forgot your password?').click();
        cy.contains(
            "Don't worry! Just fill in your email address and we'll send you a link to reset your password",
        );
        cy.get('#forgotEmailField').type('asdgsagdsa');

        cy.get('button[data-testid="send-reset-link"]').click();

        cy.contains('Invalid email address').click();
    });

    it('Opens the Sign in page', function () {
        cy.visit('/');
        cy.contains('Welcome to G.h Data.');
        cy.contains('Sign in!').click();
        cy.get('input').should('have.length', 2);
    });

    it('Checks if the password validation works well in the SignUp page', function () {
        cy.visit('/');
        cy.contains('Welcome to G.h Data.');
        cy.contains('Sign up form');

        cy.get('#password').type('tsgasdgasd');
        cy.get('button[data-testid="sign-up-button"]').click();
        cy.contains(/one uppercase required/i);
        cy.contains('Passwords must match');

        cy.get('#password').focus().clear();
        cy.get('#password').type('tsgasdgGasd');
        cy.get('button[data-testid="sign-up-button"]').click();
        cy.contains(/one number required/i);

        cy.get('#password').focus().clear();
        cy.get('#password').type('tT$5');
        cy.get('button[data-testid="sign-up-button"]').click();
        cy.contains(/Minimum 8 characters required/i);

        //check score 1 strength of password
        cy.get('#password').focus().clear();
        cy.get('#password').type('Tt1ttttt');
        cy.get('button[data-testid="sign-up-button"]').click();
        cy.contains(/Password too weak/i);

        //check score 2 strength of password
        cy.get('#password').focus().clear();
        cy.get('#password').type('tT$5aaaaa');
        cy.get('button[data-testid="sign-up-button"]').click();
        cy.contains(/Password too weak/i);
    });

    it('Validates emails', function () {
        cy.visit('/');
        cy.contains('Welcome to G.h Data.');
        cy.contains('Sign in!');
        cy.get('#email').type('test@example.com');
        cy.get('#confirmEmail').type('xxx@example.com');

        cy.get('button[data-testid="sign-up-button"]').click();

        cy.contains('Emails must match');
    });

    it('Validates passwords', function () {
        cy.visit('/');
        cy.contains('Welcome to G.h Data.');
        cy.contains('Sign in!');
        cy.get('#password').type('tsgasdgasd');
        cy.get('#passwordConfirmation').type('uuuuu');

        cy.get('button[data-testid="sign-up-button"]').click();
        cy.contains('Passwords must match');
    });

    it('Show validation error if checkbox is not selected', function () {
        cy.visit('/');
        cy.contains('Welcome to G.h Data.');
        cy.contains('Sign in!');
        cy.get('#email').type('test@example.com');
        cy.get('#confirmEmail').type('test@example.com');
        cy.get('#password').type('tsgasdgasd');
        cy.get('#passwordConfirmation').type('tsgasdgasd');

        cy.get('button[data-testid="sign-up-button"]').click();
        cy.contains('This field is required').should('have.length', 1);
    });

    it('Opens the change password page', function () {
        cy.visit('/');
        cy.visit('/reset-password/sampletoken/tokenid');
        cy.contains('Choose a new password');
        cy.get('input').should('have.length', 2);

        cy.get('button[data-testid="change-password-button"]');
    });

    it('Validates passwords in the change password page', function () {
        cy.visit('/');
        cy.visit('/reset-password/sampletoken/tokenid');
        cy.get('#password').type('tsgasdgasd');
        cy.get('#passwordConfirmation').type('uu');

        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('Passwords must match');

        cy.get('#password').type('tsgasdgasd');
        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('one uppercase required!');
        cy.contains('Passwords must match');

        cy.get('#password').focus().clear().type('tsgasdgGasd');
        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('one number required!');

        cy.get('#password').focus().clear().type('tT$5');
        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('Minimum 8 characters required!');

        //check score 1 strength of password
        cy.get('#password').focus().clear().type('Tt1ttttt');
        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('Password too weak');

        //check score 2 strength of password
        cy.get('#password').focus().clear().type('tT$5aaaaa');
        cy.get('button[data-testid="change-password-button"]').click();
        cy.contains('Password too weak');
    });

    it('Homepage with logged out user', function () {
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('Charts').should('not.exist');
        cy.contains('COVID-19 Linelist').should('not.exist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users').should('not.exist');

        cy.contains('Detailed line list data');
        cy.contains('Terms of use');
    });

    it('Homepage with logged in user with no roles', function () {
        cy.login({ roles: [], name: 'xyz', email: 'test@test.com' });
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

    it('Homepage with logged in admin', function () {
        cy.login({
            roles: ['admin'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');

        cy.contains('Create new').should('not.exist');
        cy.contains('COVID-19 Linelist');
        cy.contains('Sources').should('not.exist');
        cy.contains('Uploads').should('not.exist');
        cy.contains('Manage users');
        cy.contains('Terms of use');
    });

    it('Homepage with logged in curator', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');

        cy.contains('Create new');
        cy.contains('Line list');
        cy.contains('Sources');
        cy.contains('Uploads');
        cy.contains('Manage users').should('not.exist');
        cy.contains('Terms of use');
    });

    it('Limit number of requests to register and login ', function () {
        cy.visit('/');
        cy.get('#email').type('test@example.com');
        cy.get('#confirmEmail').type('test@example.com');
        cy.get('#password').type('tT$5aaaaak');
        cy.get('#passwordConfirmation').type('tT$5aaaaak');
        cy.get('#isAgreementChecked').check();
        for (let i = 0; i < 7; i++) {
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(1500);
            cy.get('button[data-testid="sign-up-button"]').click();
        }
        cy.contains(
            /You sent too many requests. Please wait a while then try again/i,
        );

        cy.contains('Sign in!').click();
        cy.get('#email').type('test@example.com');
        cy.get('#password').type('test');
        for (let i = 0; i < 7; i++) {
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            cy.wait(1500);
            cy.get('button[data-testid="sign-in-button"]').click();
        }
        cy.contains(/Too many failed login attempts, please try again later/i);
    });
});
