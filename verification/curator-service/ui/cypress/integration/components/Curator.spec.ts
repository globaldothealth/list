import enterSource from '../utils/enterSource';

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
        cy.visit('/cases');
        cy.contains('No records to display');
        cy.seedLocation({
            country: 'France',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'Germany',
            geometry: { latitude: 51.0968509, longitude: 5.9688274 },
            name: 'Germany',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'United Kingdom',
            geometry: { latitude: 54.2316104, longitude: -13.4274035 },
            name: 'United Kingdom',
            geoResolution: 'Country',
        });

        // Input full case.
        cy.get('button[title="Submit new case"]').click();
        enterSource('www.example.com');
        cy.get('div[data-testid="sex"]').click();
        cy.get('li[data-value="Female"').click();
        cy.get('input[name="age"]').type('21');
        cy.get('div[data-testid="ethnicity"]').click();
        cy.get('li[data-value="Asian"').click();
        cy.get('div[data-testid="nationalities"]').type('Afghan');
        cy.get('li').contains('Afghan').click();
        cy.get('div[data-testid="nationalities"]').type('Albanian');
        cy.get('li').contains('Albanian').click();
        cy.get('div[data-testid="profession"]').type('Accountant');
        cy.get('li').contains('Accountant').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.contains('France');
        cy.contains('Country');
        cy.get('li').contains('France').click();
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
        cy.get('li[data-value="Presymptomatic"').click();
        cy.get('div[data-testid="symptoms"]').type('dry cough');
        cy.get('li').contains('dry cough').click();
        cy.get('div[data-testid="symptoms"]').type('mild fever');
        cy.get('li').contains('mild fever').click();
        cy.get('div[data-testid="hasPreexistingConditions"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.get('div[data-testid="preexistingConditions"]').type(
            'ABCD syndrome',
        );
        cy.get('li').contains('ABCD syndrome').click();
        cy.get('div[data-testid="preexistingConditions"]').type(
            'ADULT syndrome',
        );
        cy.get('li').contains('ADULT syndrome').click();
        cy.get('div[data-testid="transmissionRoutes"]').type(
            'Airborne infection',
        );
        cy.get('li').contains('Airborne infection').click();
        cy.get('div[data-testid="transmissionRoutes"]').type('Breath{enter}');
        cy.get('div[data-testid="transmissionPlaces"]').type('Airplane');
        cy.get('li').contains('Airplane').click();
        cy.get('input[placeholder="Contacted case IDs"').type(
            'testcaseid12345678987654\ntestcaseid12345678987655\n',
        );
        cy.get('div[data-testid="traveledPrior30Days"]').click();
        cy.get('li[data-value="Yes"').click();
        cy.get('button[data-testid="addTravelHistory"').click();
        cy.get('div[data-testid="travelHistory[0].location"]').type('Germany');
        cy.get('li').contains('Germany').click();
        cy.get('input[name="travelHistory[0].dateRange.start"]').type(
            '2020-01-06',
        );
        cy.get('input[name="travelHistory[0].dateRange.end"]').type(
            '2020-01-07',
        );
        cy.get('div[data-testid="travelHistory[0].purpose"]').click();
        cy.get('li[data-value="Business"').click();
        cy.get('div[data-testid="travelHistory[0].methods"]').type('Car');
        cy.get('li').contains('Car').click();
        cy.get('div[data-testid="travelHistory[0].methods"]').type('Plane');
        cy.get('li').contains('Plane').click();
        cy.get('button[data-testid="addTravelHistory"').click();
        cy.get('div[data-testid="travelHistory[1].location"]').type(
            'United Kingdom',
        );
        cy.get('li').contains('United Kingdom').click();
        cy.get('input[name="travelHistory[1].dateRange.start"]').type(
            '2020-01-01',
        );
        cy.get('input[name="travelHistory[1].dateRange.end"]').type(
            '2020-01-05',
        );
        cy.get('div[data-testid="travelHistory[1].purpose"]').click();
        cy.get('li[data-value="Business"').click();
        cy.get('div[data-testid="travelHistory[1].methods"]').type('Bus');
        cy.get('li').contains('Bus').click();
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
        cy.get('li').contains('Bartonella').click();
        cy.get('div[data-testid="pathogens"]').type('Ebola');
        cy.get('li').contains('Ebola').click();
        cy.get('textarea[name="notes"]').type('test notes\non new line');
        cy.server();
        cy.route('POST', '/api/cases').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.contains('Case added');

        // Check that linelist has everything.
        cy.get('button[aria-label="close overlay"').click();
        cy.contains('No records to display').should('not.exist');
        cy.contains('www.example.com');
        cy.contains('Female');
        cy.contains('21');
        cy.contains('Asian');
        cy.contains('Afghan, Albanian');
        cy.contains('Accountant');
        cy.contains('France');
        cy.contains('1/1/2020');
        cy.contains('dry cough, mild fever');
        cy.contains('Airborne infection');
        cy.contains('Breath');
        cy.contains('Airplane');
        cy.contains('testcaseid12345678987654, testcaseid12345678987655');
        cy.contains('Germany, United Kingdom');
        cy.contains('Bartonella, Ebola');
        cy.contains('test notes');
        cy.contains('on new line');
        cy.contains('superuser@');

        // Edit the case.
        cy.get('button[title="Edit this case"]').click({ force: true });

        // Everything should be there.
        // Source.
        cy.get('div[data-testid="caseReference"]').within(() => {
            cy.get('input[type="text"]').should(
                'have.value',
                'www.example.com',
            );
        });

        // Demographics.
        cy.get('input[name="sex"]').should('have.value', 'Female');
        cy.get('input[name="age"]').should('have.value', '21');
        // TODO: tedious: check "accountant"
        cy.contains('Afghan');
        cy.contains('Albanian');

        // Location.
        cy.contains('France');
        cy.contains('Country');
        cy.contains('45.75');
        cy.contains('4.84');
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
        cy.get('input[name="outcomeDate"]').should('have.value', '2020/01/07');
        // Symptoms.
        cy.contains('dry cough');
        cy.contains('mild fever');
        // Preconditions.
        cy.contains('ABCD syndrome');
        cy.contains('ADULT syndrome');
        // Travel history.
        cy.contains('Germany');
        cy.contains('United Kingdom');
        cy.get('input[name="travelHistory[1].dateRange.start"]').should(
            'have.value',
            '2020/01/01',
        );
        cy.get('input[name="travelHistory[1].dateRange.end"]').should(
            'have.value',
            '2020/01/05',
        );
        cy.contains('Car');
        cy.contains('Plane');
        cy.contains('Business');
        cy.contains('Yes');
        // Pathogens.
        cy.contains('Bartonella');
        cy.contains('Ebola');
        cy.get('textarea[name="notes"]').should(
            'have.value',
            'test notes\non new line',
        );
        // Transmission.
        cy.contains('Airborne infection');
        cy.contains('Breath');
        cy.contains('Airplane');
        cy.contains('testcaseid12345678987654');
        cy.contains('testcaseid12345678987655');
        // Change a few things.
        cy.get('div[data-testid="sex"]').click();
        cy.get('li[data-value="Male"').click();
        // Submit the changes.
        cy.get('button[data-testid="submit"]').click();
        cy.contains('Case edited');

        // Updated info should be there.
        cy.get('button[aria-label="close overlay"').click();
        cy.contains('No records to display').should('not.exist');
        cy.contains('Male');
        // What's untouched should stay as is.
        cy.contains('Asian');

        // View full details about the case
        cy.get('button[title="View this case details"]').click({ force: true });
        // Case data.
        cy.contains('www.example.com');
        cy.contains('superuser@test.com');
        cy.contains('test notes on new line');
        // Demographics.
        cy.contains('21');
        cy.contains('Male');
        cy.contains('Accountant');
        cy.contains('Afghan, Albanian');
        cy.contains('Asian');
        cy.contains('France');
        cy.contains('45.7589');
        cy.contains('4.8414');
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
        cy.contains('Presymptomatic');
        // Preexisting conditions.
        cy.contains('ABCD syndrome, ADULT syndrome');
        // Transmission.
        cy.contains('Airborne infection');
        cy.contains('Airplane');
        cy.contains('testcaseid12345678987654');
        cy.contains('testcaseid12345678987655');
        // Travel history.
        cy.contains('Car, Plane');
        cy.contains('Business');
        cy.contains('Germany');
        cy.contains('Bus');
        cy.contains('United Kingdom');
        // Pathogens and genome.
        cy.contains('Bartonella (232), Ebola (41)');
        cy.contains('www.example2.com');
        cy.contains('test sequence name');
        cy.contains('33000');
        cy.contains('testSequenceId');
    });
});
