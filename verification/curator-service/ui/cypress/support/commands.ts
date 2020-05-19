declare global {
    namespace Cypress {
        interface Chainable {
            addCase: (country: string, notes: string, sourceUrl: string) => void
        }
    }
}

export function addCase(country: string, notes: string, sourceUrl: string): void {
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
            source: {
                url: sourceUrl,
            },
            revisionMetadata: {
                date: new Date().toJSON(),
                id: 0,
                moderator: 'test',
            },
        },
    })
}

Cypress.Commands.add('addCase', addCase);
