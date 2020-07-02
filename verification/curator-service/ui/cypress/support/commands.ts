import 'cypress-file-upload';

declare global {
    // One-off Cypress setup.
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            addCase: (opts: {
                country: string;
                notes: string;
                sourceUrl: string;
                methodOfConfirmation?: string;
                nationalities?: string[];
                curator?: string;
            }) => void;
            login: () => void;
            addSource: (name: string, url: string) => void;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            seedLocation: (loc: any) => void;
            clearSeededLocations: () => void;
        }
    }
}

export function addCase(opts: {
    country: string;
    notes: string;
    sourceUrl: string;
    methodOfConfirmation?: string;
    nationalities?: string[];
    curator?: string;
}): void {
    cy.request({
        method: 'POST',
        url: '/api/cases',
        body: {
            caseReference: {
                sourceId: 'CDC',
                sourceUrl: 'www.example.com',
            },
            demographics: {
                nationalities: opts.nationalities,
            },
            location: {
                country: opts.country,
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
                    value: opts.methodOfConfirmation,
                },
            ],
            notes: opts.notes,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: opts.curator || 'test',
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
