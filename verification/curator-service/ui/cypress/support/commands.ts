import 'cypress-file-upload';

import fullCase from '../fixtures/fullCase.json';

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
            }) => void;
            addFullCase: () => void;
            login: () => void;
            addSource: (name: string, url: string) => void;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            seedLocation: (loc: any) => void;
            clearSeededLocations: () => void;
        }
    }
}

export function addFullCase() {
    cy.fixture('fullCase').then((json) => {
        cy.request({
            method: 'POST',
            url: '/api/cases',
            body: json,
        });
    });
}

export function addCase(opts: {
    country: string;
    notes: string;
    sourceUrl: string;
    methodOfConfirmation?: string;
    nationalities?: string[];
}): void {
    cy.request({
        method: 'POST',
        url: '/api/cases',
        body: {
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
            sources: [
                {
                    url: opts.sourceUrl,
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
Cypress.Commands.add('addFullCase', addFullCase);
Cypress.Commands.add('login', login);
Cypress.Commands.add('addSource', addSource);
Cypress.Commands.add('seedLocation', seedLocation);
Cypress.Commands.add('clearSeededLocations', clearSeededLocations);
