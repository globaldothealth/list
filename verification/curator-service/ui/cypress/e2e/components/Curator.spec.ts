/* eslint-disable no-undef */
describe('Curator', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Can Create, edit and view a full case', function () {
        cy.intercept('GET', '/api/geocode/suggest?q=Spain', {
            fixture: 'geolocation_spain_suggest.json',
        }).as('geolocationSpainSuggest');

        cy.intercept('GET', '/api/geocode/suggest?q=France', {
            fixture: 'geolocation_france_suggest.json',
        }).as('geolocationFranceSuggest');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');
        cy.seedLocation({
            country: 'FR',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'DE',
            geometry: { latitude: 51.0968509, longitude: 5.9688274 },
            name: 'Germany',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'GB',
            geometry: { latitude: 54.2316104, longitude: -13.4274035 },
            name: 'United Kingdom',
            geoResolution: 'Country',
        });

        const sidebar = cy.get(
            'div[data-testid="sidebar"] .MuiDrawer-paperAnchorDockedLeft',
        );
        sidebar.then((sidebar) => {
            if (sidebar.css('visibility') == 'hidden') {
                cy.get('button[aria-label="toggle drawer"]').click();
            }
        });

        // Input full case.
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New line list case').click();
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
        cy.get('input[name="caseReference.sourceName"]').type('Example source');
        cy.get('input[name="caseReference.sourceLicense"]').type('MPL');
        cy.get('div[data-testid="sourceEntryId"]')
            .click()
            .type('testSourceEntryID123');
        cy.get('div[data-testid="gender"]').click();
        cy.get('li[data-value="Female"').click();
        // TODO UI for age entry needs redesign
        cy.get('div[data-testid="ethnicity"]').click().type('Asian');
        cy.get('div[data-testid="nationalities"]').type('Afghan');
        cy.contains('li', 'Afghan').click();
        cy.get('div[data-testid="nationalities"]').type('Albanian');
        cy.contains('li', 'Albanian').click();
        cy.get('div[data-testid="occupation"]').type('Accountant');
        cy.contains('li', 'Accountant').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.wait('@geolocationFranceSuggest');
        cy.contains('France').click();
        /* Change France to something else to check we can edit geocode results.
         * We need to change it to a valid country so that we can find the ISO code!
         */
        cy.get('div[data-testid="location"]').clear().type('Germany');
        cy.contains('Germany').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.get('div[data-testid="methodOfConfirmation"]').click();
        cy.get('li[data-value="PCR test"').click();
        cy.get('input[name="onsetSymptomsDate"]').type('2020-01-02');
        cy.get('input[name="firstClinicalConsultationDate"]').type(
            '2020-01-03',
        );
        cy.get('input[name="selfIsolationDate"]').type('2020-01-04');
        cy.get('div[data-testid="admittedToHospital"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.get('input[name="hospitalAdmissionDate"]').type('2020-01-05');
        cy.get('div[data-testid="admittedToIcu"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.get('input[name="icuAdmissionDate"]').type('2020-01-06');
        cy.get('div[data-testid="outcome"]').click();
        cy.get('li[data-value="Recovered"').click();
        cy.get('input[name="outcomeDate"]').type('2020-01-07');
        cy.get('div[data-testid="symptomsStatus"]').click();
        cy.get('li[data-value="Symptomatic"').click();
        cy.get('div[data-testid="symptoms"]').type('dry cough');
        cy.contains('li', 'dry cough').click();
        cy.get('div[data-testid="symptoms"]').type('mild fever');
        cy.contains('li', 'mild fever').click();
        cy.get('div[data-testid="hasPreexistingConditions"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.get('div[data-testid="preexistingConditions"]').type(
            'ABCD syndrome',
        );
        cy.contains('li', 'ABCD syndrome').click();
        cy.get('div[data-testid="preexistingConditions"]').type(
            'ADULT syndrome',
        );
        cy.contains('li', 'ADULT syndrome').click();
        cy.get('div[data-testid="transmissionRoutes"]').type(
            'Airborne infection',
        );
        cy.contains('li', 'Airborne infection').click();
        cy.get('div[data-testid="transmissionRoutes"]').type('Test route');
        cy.contains('li', 'Test route').click();
        cy.get('div[data-testid="transmissionPlaces"]').type('Airplane');
        cy.contains('li', 'Airplane').click();
        cy.get('div[data-testid="transmissionPlaces"]').type('Test place');
        cy.contains('li', 'Test place').click();
        cy.get('input[placeholder="Contacted case IDs"').type(
            'testcaseid12345678987654\ntestcaseid12345678987655\n',
        );
        cy.get('div[data-testid="traveledPrior30Days"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.get('button[data-testid="addTravelHistory"').click();
        cy.get('div[data-testid="travelHistory[0].location"]').type('Germany');
        cy.contains('li', 'Germany').click();
        cy.get('input[name="travelHistory[0].dateRange.start"]').type(
            '2020-01-06',
        );
        cy.get('input[name="travelHistory[0].dateRange.end"]').type(
            '2020-01-07',
        );
        cy.get('div[data-testid="travelHistory[0].purpose"]').click();
        cy.get('li[data-value="Business"').click();
        cy.get('div[data-testid="travelHistory[0].methods"]').type('Car');
        cy.contains('li', 'Car').click();
        cy.get('div[data-testid="travelHistory[0].methods"]').type(
            'Test method',
        );
        cy.contains('li', 'Test method').click();
        cy.get('button[data-testid="addTravelHistory"').click();
        cy.get('div[data-testid="travelHistory[1].location"]').type('Spain');
        cy.wait('@geolocationSpainSuggest');
        cy.contains('li', 'Spain').click();
        cy.get('input[name="travelHistory[1].dateRange.start"]').type(
            '2020-01-01',
        );
        cy.get('input[name="travelHistory[1].dateRange.end"]').type(
            '2020-01-05',
        );
        cy.get('div[data-testid="travelHistory[1].purpose"]').click();
        cy.get('li[data-value="Business"').click();
        cy.get('div[data-testid="travelHistory[1].methods"]').type('Bus');
        cy.contains('li', 'Bus').click();
        cy.get('button[data-testid="addGenomeSequence"').click();
        cy.get('input[name="genomeSequences[0].sampleCollectionDate"]').type(
            '2020-01-01',
        );
        cy.get('input[name="genomeSequences[0].repositoryUrl"]').type(
            'www.example2.com',
        );
        cy.get('input[name="genomeSequences[0].sequenceId"]').type(
            'testSequenceId',
        );
        cy.get('input[name="genomeSequences[0].sequenceName"]').type(
            'test sequence name',
        );
        cy.get('input[name="genomeSequences[0].sequenceLength"]').type('33000');
        cy.get('div[data-testid="pathogens"]').type('Bartonella');
        cy.contains('li', 'Bartonella').click();
        cy.get('div[data-testid="pathogens"]').type('Ebola');
        cy.contains('li', 'Ebola').click();
        cy.get('textarea[name="notes"]').type('test notes\non new line');

        cy.intercept('POST', '/api/cases?num_cases=1').as('addCase');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');

        // Check that linelist has everything.
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.get('svg[data-testid="verified-svg"').should('exist');
            cy.contains('www.example.com');
            cy.contains('Female');
            // TODO UI for demographics.age needs redesigning
            cy.contains('Germany');
            cy.contains('2020-01-01');
            cy.contains('Recovered');

            cy.intercept('GET', `/api/cases/${resp.body.cases[0]._id}`).as(
                'fetchCaseDetails',
            );

            // View the case from the message bar.
            cy.get('button[data-testid="view-case-btn"').click({ force: true });
            cy.wait('@fetchCaseDetails');

            cy.contains(/Case details\b/);

            // Edit the case.
            cy.get('button').contains(/EDIT/i).click();

            // Everything should be there.
            // Source.
            cy.get('div[data-testid="caseReference"]').within(() => {
                cy.get('input[type="text"]').should(
                    'have.value',
                    'www.example.com',
                );
            });

            // Demographics.
            cy.get('input[name="gender"]').should('have.value', 'Female');
            // TODO UI for demographics.age needs redesign
            cy.get('div[data-testid="occupation"]').within(() => {
                cy.get('input[type="text"]').should('have.value', 'Accountant');
            });
            cy.contains('Afghan');
            cy.contains('Albanian');

            // Location.
            cy.get('input[name="location.country"]').should(
                'have.value',
                'Germany',
            );
            cy.get('input[name="location.geometry.latitude"]').should(
                'have.value',
                '51.0968509',
            );
            cy.get('input[name="location.geometry.longitude"]').should(
                'have.value',
                '5.9688274',
            );
            // Events.
            cy.get('input[name="onsetSymptomsDate"]').should(
                'have.value',
                '2020/01/02',
            );
            cy.get('input[name="confirmedDate"]').should(
                'have.value',
                '2020/01/01',
            );
            cy.get('input[name="methodOfConfirmation"]').should(
                'have.value',
                'PCR test',
            );
            cy.get('input[name="hospitalAdmissionDate"]').should(
                'have.value',
                '2020/01/05',
            );
            cy.get('input[name="icuAdmissionDate"]').should(
                'have.value',
                '2020/01/06',
            );
            cy.get('input[name="outcome"]').should('have.value', 'Recovered');
            cy.get('input[name="outcomeDate"]').should(
                'have.value',
                '2020/01/07',
            );
            // Symptoms.
            cy.contains('dry cough');
            cy.contains('mild fever');
            // Preconditions.
            cy.contains('ABCD syndrome');
            cy.contains('ADULT syndrome');
            // Travel history.
            cy.contains('Germany');
            cy.contains('Spain');
            cy.get('input[name="travelHistory[1].dateRange.start"]').should(
                'have.value',
                '2020/01/01',
            );
            cy.get('input[name="travelHistory[1].dateRange.end"]').should(
                'have.value',
                '2020/01/05',
            );
            cy.contains('Car');
            cy.contains('Test method');
            cy.contains('Business');
            cy.contains('Yes');
            // Pathogens.
            cy.contains('Bartonella');
            cy.contains('Ebola');
            // Transmission.
            cy.contains('Airborne infection');
            cy.contains('Test route');
            cy.contains('Airplane');
            cy.contains('Test place');
            cy.contains('testcaseid12345678987654');
            cy.contains('testcaseid12345678987655');
            // Change a few things.
            cy.get('div[data-testid="gender"]').click();
            cy.get('li[data-value="Male"').click();
            // Check you can submit any value for occupation
            cy.get('div[data-testid="occupation"]').within(() => {
                cy.get('input[type="text"]').clear().type('Test occupation');
            });
            cy.contains('li', 'Test occupation').click();
            // Submit the changes.
            cy.get('button[data-testid="submit"]').click();

            // Updated info should be there.
            cy.contains(`Case ${resp.body.cases[0]._id} edited`);
            cy.contains(`Case ${resp.body.cases[0]._id} added`).should(
                'not.exist',
            );
            cy.contains('No records to display').should('not.exist');
            cy.contains('Male');
            // What's untouched should stay as is.
            // TODO UI for demographics.age needs redesigning
            // View full details about the case
            cy.contains('td', 'www.example.com').click({ force: true });
            // Case data.
            cy.contains('www.example.com');
            cy.contains('superuser@test.com');
            cy.contains('VERIFIED');
            // Demographics.
            // TODO UI for demographics.age needs redesigning
            cy.contains('Male');
            cy.contains('Test occupation');
            cy.contains('Afghan, Albanian');
            cy.contains('Asian');
            cy.contains('Germany');
            // Rounded numbers when displayed.
            cy.contains('51.0969');
            cy.contains('5.9688');
            // Events.
            cy.contains('2020-01-01');
            cy.contains('2020-01-02');
            cy.contains('2020-01-03');
            cy.contains('2020-01-04');
            cy.contains('2020-01-05');
            cy.contains('2020-01-06');
            cy.contains('PCR test');
            cy.contains('Recovered');
            cy.contains('Yes');
            //  Symptoms.
            cy.contains('dry cough, mild fever');
            cy.contains('Symptomatic');
            // Preexisting conditions.
            cy.contains('ABCD syndrome (AS), ADULT syndrome (AS)');
            // Transmission.
            cy.contains('Airborne infection');
            cy.contains('Test route');
            cy.contains('Airplane');
            cy.contains('Test place');
            cy.contains('testcaseid12345678987654');
            cy.contains('testcaseid12345678987655');
            // Travel history.
            cy.contains('Car, Test method');
            cy.contains('Business');
            cy.contains('Germany');
            cy.contains('Bus');
            cy.contains('Spain');
            // Pathogens and genome.
            cy.contains('Bartonella (232), Ebola (41)');
            cy.contains('www.example2.com');
            cy.contains('test sequence name');
            cy.contains('33000');
            cy.contains('testSequenceId');
        });
    });
});
