import 'cypress-file-upload';

declare global {
    // One-off Cypress setup.
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            addCase: (opts: {
                country: string;
                methodOfConfirmation?: string;
                nationalities?: string[];
                notes?: string;
                occupation?: string;
                symptomStatus?: string;
                symptoms?: string[];
                transmissionPlaces?: string[];
                uploadIds?: string[];
            }) => void;
            login: (opts?: {
                name: string;
                email: string;
                roles: string[];
            }) => void;
            addSource: (name: string, url: string, uploads?: []) => void;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            seedLocation: (loc: any) => void;
            clearSeededLocations: () => void;
        }
    }
}

export function addCase(opts: {
    country: string;
    methodOfConfirmation?: string;
    nationalities?: string[];
    notes?: string;
    occupation?: string;
    symptomStatus?: string;
    symptoms?: string[];
    transmissionPlaces?: string[];
    uploadIds?: string;
}): void {
    cy.request({
        method: 'POST',
        url: '/api/cases',
        body: {
            caseReference: {
                sourceId: '5ef8e943dfe6e00030892d58',
                sourceUrl: 'www.example.com',
                uploadIds: opts.uploadIds,
            },
            demographics: {
                nationalities: opts.nationalities,
                occupation: opts.occupation,
            },
            location: {
                country: opts.country,
                geoResolution: 'Country',
                geometry: {
                    latitude: 42,
                    longitude: 12,
                },
                name: opts.country,
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
            symptoms: {
                status: opts.symptomStatus ?? undefined,
                values: opts.symptoms ?? [],
            },
            transmission: {
                places: opts.transmissionPlaces ?? [],
            },
            notes: opts.notes,
        },
    });
}

export function login(opts?: {
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
            roles: opts?.roles ?? ['admin', 'curator'],
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

export function addSource(name: string, url: string, uploads?: []): void {
    cy.request({
        method: 'POST',
        url: '/api/sources',
        body: {
            name: name,
            origin: {
                url: url,
                license: 'MIT',
            },
            uploads: uploads,
            format: 'JSON',
        },
    });
}

Cypress.Commands.add('addCase', addCase);
Cypress.Commands.add('login', login);
Cypress.Commands.add('addSource', addSource);
Cypress.Commands.add('seedLocation', seedLocation);
Cypress.Commands.add('clearSeededLocations', clearSeededLocations);
