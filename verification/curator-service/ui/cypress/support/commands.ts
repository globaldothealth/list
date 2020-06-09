declare global {
    namespace Cypress {
        interface Chainable {
            addCase: (
                country: string,
                notes: string,
                sourceUrl: string,
            ) => void;
            login: () => void;
            addSource: (name: string, url: string) => void;
        }
    }
}

export function addCase(
    country: string,
    notes: string,
    sourceUrl: string,
): void {
    // Get CSRF token first, then add case.
    cy.request('/auth/profile').then((resp) => {
        cy.request({
            method: 'POST',
            url: '/api/cases',
            body: {
                location: {
                    country: country,
                },
                events: [
                    {
                        name: 'confirmed',
                        dateRange: {
                            start: new Date().toJSON(),
                        },
                    },
                ],
                notes: notes,
                sources: [
                    {
                        url: sourceUrl,
                    },
                ],
                revisionMetadata: {
                    date: new Date().toJSON(),
                    id: 0,
                    moderator: 'test',
                },
            },
            headers: {
                'csrf-token': resp.body.csrfToken,
            },
        });
    });
}

export function login(opts: {
    name: string;
    email: string;
    roles: string[];
}): void {
    cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
            name: opts?.name ?? 'superuser',
            email: opts?.email ?? 'superuser@test.com',
            roles: opts?.roles ?? ['admin', 'curator', 'reader'],
        },
    })
        .request({
            // Always call /auth/profile after being logged in to get proper csrf token.
            // The real app will do it to show the navbar properly but tests shouldn't have to
            // wait for that.{
            method: 'GET',
            url: '/auth/profile',
        })
        .getCookies()
        .then((cookies) => console.log(cookies));
}

export function addSource(name: string, url: string): void {
    // Get CSRF token first, then add source.
    cy.request('/auth/profile').then((resp) => {
        cy.request({
            method: 'POST',
            url: '/api/sources',
            body: {
                name: name,
                origin: {
                    url: url,
                },
            },
            headers: {
                'csrf-token': resp.body.csrfToken,
            },
        });
    });
}

Cypress.Commands.add('addCase', addCase);
Cypress.Commands.add('login', login);
Cypress.Commands.add('addSource', addSource);
