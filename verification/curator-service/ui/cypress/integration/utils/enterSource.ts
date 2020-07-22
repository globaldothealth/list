export default function enterSource(url: string, existingSource = false): void {
    if (existingSource) {
        cy.get('div[data-testid="caseReference"]').type(
            `${url}{downarrow}{enter}`,
        );
    } else {
        cy.get('div[data-testid="caseReference"]').type(
            `${url}{downarrow}{enter}`,
        );
        cy.get('input[id="name"]').type('New source');
        cy.server();
        cy.route('POST', '/api/sources').as('addSource');
        cy.get('button[data-testid="sourceAdd"').click();
        cy.wait('@addSource');
    }
}
