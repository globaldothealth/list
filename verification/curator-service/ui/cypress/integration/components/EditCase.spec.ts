/* eslint-disable no-undef */
describe('Edit case', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Errors when case does not exist', function () {
        cy.visit('/cases/edit/foo');
        cy.contains('Request failed');
    });

    it('can edit a minimal case', function () {
        cy.addCase({
            country: 'France',
            notes: 'some notes',
            sourceUrl: 'www.example.com',
            methodOfConfirmation: 'PCR test',
            nationalities: ['Andorrean', 'French'],
        });
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.visit(`/cases/edit/${resp.body.cases[0]._id}`);
            // Check that we have something from the original case.
            cy.contains('France');
            cy.contains('Andorrean');
            cy.contains('French');
            cy.contains('Female').should('not.exist');
            cy.contains('21').should('not.exist');
            // Change a few things.
            cy.get('div[data-testid="sex"]').click();
            cy.get('li[data-value="Female"').click();
            cy.get('input[name="age"]').type('21');
            // Submit the changes.
            cy.server();
            cy.route('PUT', `/api/cases/${resp.body.cases[0]._id}`).as(
                'editCase',
            );
            cy.get('button[data-testid="submit"]').click();
            cy.wait('@editCase');
            cy.contains('Case edited');
            // Updated info should be there.
            cy.visit('/cases');
            cy.contains('No records to display').should('not.exist');
            cy.contains('Female');
            cy.contains('21');
            // What's untouched should stay as is.
            cy.contains('Andorrean');
            cy.contains('French');
        });
    });

    it('can edit a full case', function () {
        cy.addFullCase();
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.visit(`/cases/edit/${resp.body.cases[0]._id}`);
            // Check that we could parse the original case.
            // Source.
            cy.get('input[name="sourceUrl"]').should(
                'have.value',
                'https://www.colorado.gov/pacific/cdphe/news/10-new-presumptive-positive-cases-colorado-cdphe-confirms-limited-community-spread-covid-19',
            );
            // Demographics.
            cy.get('input[name="sex"]').should('have.value', 'Female');
            cy.get('input[name="minAge"]').should('have.value', '50');
            cy.get('input[name="maxAge"]').should('have.value', '59');
            // TODO: tedious: check "horse breeder"
            cy.contains('Swedish');
            cy.contains('Asian');
            // Location.
            cy.contains('France');
            cy.contains('Paris');
            cy.contains('Île-de-F');
            cy.contains('Admin2');
            cy.contains('2.3522');
            cy.contains('48.8566');
            // Events.
            cy.get('input[name="onsetSymptomsDate"]').should(
                'have.value',
                '2020/01/01',
            );
            cy.get('input[name="confirmedDate"]').should(
                'have.value',
                '2020/01/02',
            );
            cy.get('input[name="methodOfConfirmation"]').should(
                'have.value',
                'PCR test',
            );
            cy.get('input[name="hospitalAdmissionDate"]').should(
                'have.value',
                '2020/01/03',
            );
            cy.get('input[name="icuAdmissionDate"]').should(
                'have.value',
                '2020/01/04',
            );
            cy.get('input[name="outcome"]').should('have.value', 'Recovered');
            // Symptoms.
            cy.contains('Symptomatic');
            cy.contains('Severe pneumonia');
            // Preexisting conditions.
            cy.contains('Hypertension');
            // Travel history.
            cy.get('input[name="travelHistory[0].dateRange.start"]').should(
                'have.value',
                '2020/01/10',
            );
            cy.get('input[name="travelHistory[0].dateRange.end"]').should(
                'have.value',
                '2020/01/17',
            );
            cy.contains('United States');
            cy.contains('New York');
            cy.contains('Kings County');
            cy.contains('Brooklyn');
            cy.contains('Point');
            cy.contains('Plane');
            cy.contains('Family');
            cy.contains('Yes');
            // Pathogens.
            cy.contains('Pneumonia');
            cy.get('textarea[name="notes"]').should(
                'have.value',
                'Contact of a confirmed case at work.',
            );
            // Transmission.
            cy.contains('Vector borne');
            cy.contains('Gym');
            cy.contains('bbf8e943dfe6e00030892dcc');
            cy.contains('aaf8e943dfe6e00030892dee');
            // Change a few things.
            cy.get('div[data-testid="sex"]').click();
            cy.get('li[data-value="Male"').click();
            // Submit the changes.
            cy.server();
            cy.route('PUT', `/api/cases/${resp.body.cases[0]._id}`).as(
                'editCase',
            );
            cy.get('button[data-testid="submit"]').click();
            cy.wait('@editCase');
            cy.contains('Case edited');
            // Updated info should be there.
            cy.visit('/cases');
            cy.contains('No records to display').should('not.exist');
            cy.contains('Male');
            // What's untouched should stay as is.
            cy.contains('Swedish');
        });
    });
});
