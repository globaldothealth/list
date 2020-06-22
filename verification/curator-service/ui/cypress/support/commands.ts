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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            seedLocation: (loc: any) => void;
            clearSeededLocations: () => void;
        }
    }
}

export function addCase(
    country: string,
    notes: string,
    sourceUrl: string,
): void {
    cy.request({
        method: 'POST',
        url: '/api/cases',
        body: {
            location: {
                country: country,
                geoResolution: 'Country',
                geometry: {
                    latitude: 42,
                    longitude: 12,
                },
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
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'test',
                    date: new Date().toJSON(),
                },
            },
        },
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
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function seedLocation(loc: any): void {
    cy.request({
        method: 'POST',
        url: '/api/geocode/seed',
        body: loc,
    });
}

export function clearSeededLocations(): void {
    cy.request({
        method: 'POST',
        url: '/api/geocode/clear',
    });
}

export function addSource(name: string, url: string): void {
    cy.request({
        method: 'POST',
        url: '/api/sources',
        body: {
            name: name,
            origin: {
                url: url,
            },
        },
    });
}

Cypress.Commands.add('addCase', addCase);
Cypress.Commands.add('login', login);
Cypress.Commands.add('addSource', addSource);
Cypress.Commands.add('seedLocation', seedLocation);
Cypress.Commands.add('clearSeededLocations', clearSeededLocations);
