export default function enterSource(url: string): void {
    cy.get('div[data-testid="caseReference"]').type(`${url}{downarrow}{enter}`);
    cy.get('input[id="name"]').type('New source');
    cy.server();
    cy.route('POST', '/api/sources').as('addSource');
    cy.get('button[data-testid="sourceAdd"').click();
    cy.wait('@addSource');
}
