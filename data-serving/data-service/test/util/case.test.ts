// @ts-nocheck Unable to block-ignore errors ('Property does not exist' in this file)
// https://github.com/Microsoft/TypeScript/issues/19573

import { CaseDocument } from '../model/case';
import { CaseReferenceDocument } from '../model/case-reference';
import { DemographicsDocument } from '../model/demographics';
import { EventDocument } from '../model/event';
import { LocationDocument } from '../model/location';
import { PathogenDocument } from '../model/pathogen';
import { PreexistingConditionsDocument } from '../model/preexisting-conditions';
import { RevisionMetadataDocument } from '../model/revision-metadata';
import { SymptomsDocument } from '../model/symptoms';
import { TransmissionDocument } from '../model/transmission';
import { TravelHistoryDocument } from '../model/travel-history';
import { VaccineDocument } from '../model/vaccine';
import { VariantDocument } from '../model/variant';
import { 
    parseCaseEvents,
    parseDownloadedCase,
    denormalizeEventsHeaders,
    removeBlankHeader,
    denormalizeFields,
} from '../../src/util/case';
import events from '../model/data/case.events.json';

describe('Case', () => {
    it('is parsed properly for download', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Not necessary to mock full Mongoose type in JSON file
        const res = parseDownloadedCase({
            events,
            symptoms: {
                values: ['Cough', 'Pneumonia'],
            },
            demographics: {
                nationalities: [],
            },
        } as CaseDTO);

        expect(res.events).toEqual({
            onsetSymptoms: {
                value: '',
                date: '2020-11-14',
            },
            confirmed: {
                value: 'PCR test',
                date: '2020-11-19',
            },
            hospitalAdmission: {
                value: '',
                date: '2020-11-20',
            },
            outcome: {
                value: 'Recovered',
                date: '2020-12-01',
            },
        });

        expect(res.symptoms.values).toEqual('Cough,Pneumonia');
        expect(res.demographics.nationalities).toEqual('');
    });
    it('events are parsed properly for download', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Not necessary to mock full Mongoose type in JSON file
        const res = parseCaseEvents(events as EventDocument[]);

        expect(res).toEqual({
            onsetSymptoms: {
                value: '',
                date: '2020-11-14',
            },
            confirmed: {
                value: 'PCR test',
                date: '2020-11-19',
            },
            hospitalAdmission: {
                value: '',
                date: '2020-11-20',
            },
            outcome: {
                value: 'Recovered',
                date: '2020-12-01',
            },
        });
    });
    it('denormalizes event headers', () => {
        let headers = ['_id','caseReference.additionalSources','caseReference.sourceEntryId','caseReference.sourceId',
            'caseReference.sourceUrl','caseReference.uploadIds','caseReference.verificationStatus',
            'demographics.ageRange.end','demographics.ageRange.start','demographics.ethnicity',
            'demographics.gender','demographics.nationalities','demographics.occupation','events','genomeSequences',
            'location.administrativeAreaLevel1','location.administrativeAreaLevel2','location.administrativeAreaLevel3',
            'location.country','location.geoResolution','location.geometry.latitude','location.geometry.longitude',
            'location.name','location.place','location.query','notes','pathogens',
            'preexistingConditions.hasPreexistingConditions','preexistingConditions.values',
            'revisionMetadata.creationMetadata.curator','revisionMetadata.creationMetadata.date',
            'revisionMetadata.creationMetadata.notes','revisionMetadata.editMetadata.curator',
            'revisionMetadata.editMetadata.date','revisionMetadata.editMetadata.notes','revisionMetadata.revisionNumber',
            'SGTF', 'symptoms.status','symptoms.values','transmission.linkedCaseIds','transmission.places',
            'transmission.routes','travelHistory.travel.dateRange.end','travelHistory.travel.dateRange.start',
            'travelHistory.travel.location.name','travelHistory.travel.methods','travelHistory.travel.purpose',
            'travelHistory.traveledPrior30Days','vaccines.0.name','vaccines.0.batch','vaccines.0.date',
            'vaccines.0.sideEffects','vaccines.1.name','vaccines.1.batch','vaccines.1.date','vaccines.1.sideEffects',
            'vaccines.2.name','vaccines.2.batch','vaccines.2.date','vaccines.2.sideEffects','vaccines.3.name',
            'vaccines.3.batch','vaccines.3.date','vaccines.3.sideEffects',''];
        headers = denormalizeEventsHeaders(headers);
        expect(headers.sort()).toEqual(
            ['_id','caseReference.additionalSources','caseReference.sourceEntryId','caseReference.sourceId',
            'caseReference.sourceUrl','caseReference.uploadIds','caseReference.verificationStatus',
            'demographics.ageRange.end','demographics.ageRange.start','demographics.ethnicity',
            'demographics.gender','demographics.nationalities','demographics.occupation','events.confirmed.date',
            'events.firstClinicalConsultation.date', 'events.onsetSymptoms.date',
            'events.selfIsolation.date', 'events.hospitalAdmission.date', 'events.icuAdmission.date',
            'events.outcome.date', 'events.confirmed.value', 'events.hospitalAdmission.value',
            'events.outcome.value','events.icuAdmission.value', 'genomeSequences','location.administrativeAreaLevel1',
            'location.administrativeAreaLevel2','location.administrativeAreaLevel3',
            'location.country','location.geoResolution','location.geometry.latitude','location.geometry.longitude',
            'location.name','location.place','location.query','notes','pathogens',
            'preexistingConditions.hasPreexistingConditions','preexistingConditions.values',
            'revisionMetadata.creationMetadata.curator','revisionMetadata.creationMetadata.date',
            'revisionMetadata.creationMetadata.notes','revisionMetadata.editMetadata.curator',
            'revisionMetadata.editMetadata.date','revisionMetadata.editMetadata.notes','revisionMetadata.revisionNumber',
            'SGTF', 'symptoms.status','symptoms.values','transmission.linkedCaseIds','transmission.places',
            'transmission.routes','travelHistory.travel.dateRange.end','travelHistory.travel.dateRange.start',
            'travelHistory.travel.location.name','travelHistory.travel.methods','travelHistory.travel.purpose',
            'travelHistory.traveledPrior30Days','vaccines.0.name','vaccines.0.batch','vaccines.0.date',
            'vaccines.0.sideEffects','vaccines.1.name','vaccines.1.batch','vaccines.1.date','vaccines.1.sideEffects',
            'vaccines.2.name','vaccines.2.batch','vaccines.2.date','vaccines.2.sideEffects','vaccines.3.name',
            'vaccines.3.batch','vaccines.3.date','vaccines.3.sideEffects',''].sort()
        );
    });
    it('removes the blank header', () => {
        let headers = ['_id','caseReference.additionalSources','caseReference.sourceEntryId','caseReference.sourceId',
            'caseReference.sourceUrl','caseReference.uploadIds','caseReference.verificationStatus',
            'demographics.ageRange.end','demographics.ageRange.start','demographics.ethnicity',
            'demographics.gender','demographics.nationalities','demographics.occupation','events.confirmed.date',
            'events.firstClinicalConsultation.date', 'events.onsetSymptoms.date',
            'events.selfIsolation.date', 'events.hospitalAdmission.date', 'events.icuAdmission.date',
            'events.outcome.date', 'events.firstClinicalConsultation.value', 'events.onsetSymptoms.value',
            'events.selfIsolation.value', 'genomeSequences','location.administrativeAreaLevel1',
            'location.administrativeAreaLevel2','location.administrativeAreaLevel3',
            'location.country','location.geoResolution','location.geometry.latitude','location.geometry.longitude',
            'location.name','location.place','location.query','notes','pathogens',
            'preexistingConditions.hasPreexistingConditions','preexistingConditions.values',
            'revisionMetadata.creationMetadata.curator','revisionMetadata.creationMetadata.date',
            'revisionMetadata.creationMetadata.notes','revisionMetadata.editMetadata.curator',
            'revisionMetadata.editMetadata.date','revisionMetadata.editMetadata.notes','revisionMetadata.revisionNumber',
            'SGTF', 'symptoms.status','symptoms.values','transmission.linkedCaseIds','transmission.places',
            'transmission.routes','travelHistory.travel.dateRange.end','travelHistory.travel.dateRange.start',
            'travelHistory.travel.location.name','travelHistory.travel.methods','travelHistory.travel.purpose',
            'travelHistory.traveledPrior30Days','vaccines.0.name','vaccines.0.batch','vaccines.0.date',
            'vaccines.0.sideEffects','vaccines.1.name','vaccines.1.batch','vaccines.1.date','vaccines.1.sideEffects',
            'vaccines.2.name','vaccines.2.batch','vaccines.2.date','vaccines.2.sideEffects','vaccines.3.name',
            'vaccines.3.batch','vaccines.3.date','vaccines.3.sideEffects','']
        headers = removeBlankHeader(headers);
        expect(headers).toEqual(
            ['_id','caseReference.additionalSources','caseReference.sourceEntryId','caseReference.sourceId',
            'caseReference.sourceUrl','caseReference.uploadIds','caseReference.verificationStatus',
            'demographics.ageRange.end','demographics.ageRange.start','demographics.ethnicity',
            'demographics.gender','demographics.nationalities','demographics.occupation','events.confirmed.date',
            'events.firstClinicalConsultation.date', 'events.onsetSymptoms.date',
            'events.selfIsolation.date', 'events.hospitalAdmission.date', 'events.icuAdmission.date',
            'events.outcome.date', 'events.firstClinicalConsultation.value', 'events.onsetSymptoms.value',
            'events.selfIsolation.value', 'genomeSequences','location.administrativeAreaLevel1',
            'location.administrativeAreaLevel2','location.administrativeAreaLevel3',
            'location.country','location.geoResolution','location.geometry.latitude','location.geometry.longitude',
            'location.name','location.place','location.query','notes','pathogens',
            'preexistingConditions.hasPreexistingConditions','preexistingConditions.values',
            'revisionMetadata.creationMetadata.curator','revisionMetadata.creationMetadata.date',
            'revisionMetadata.creationMetadata.notes','revisionMetadata.editMetadata.curator',
            'revisionMetadata.editMetadata.date','revisionMetadata.editMetadata.notes','revisionMetadata.revisionNumber',
            'SGTF', 'symptoms.status','symptoms.values','transmission.linkedCaseIds','transmission.places',
            'transmission.routes','travelHistory.travel.dateRange.end','travelHistory.travel.dateRange.start',
            'travelHistory.travel.location.name','travelHistory.travel.methods','travelHistory.travel.purpose',
            'travelHistory.traveledPrior30Days','vaccines.0.name','vaccines.0.batch','vaccines.0.date',
            'vaccines.0.sideEffects','vaccines.1.name','vaccines.1.batch','vaccines.1.date','vaccines.1.sideEffects',
            'vaccines.2.name','vaccines.2.batch','vaccines.2.date','vaccines.2.sideEffects','vaccines.3.name',
            'vaccines.3.batch','vaccines.3.date','vaccines.3.sideEffects']
        );
    });
    it('handles any undefined fields', () => {
        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);

        expect(denormalizedCase['caseReference.sourceId']).toEqual('');
        expect(denormalizedCase['caseReference.sourceEntryId']).toEqual('');
        expect(denormalizedCase['caseReference.sourceUrl']).toEqual('');
        expect(denormalizedCase['caseReference.uploadIds']).toEqual('');
        expect(denormalizedCase['caseReference.verificationStatus']).toEqual('');
        expect(denormalizedCase['caseReference.additionalSources']).toEqual('');
        expect(denormalizedCase['demographics.ageRange.end']).toEqual('');
        expect(denormalizedCase['demographics.ageRange.start']).toEqual('');
        expect(denormalizedCase['demographics.ethnicity']).toEqual('');
        expect(denormalizedCase['demographics.gender']).toEqual('');
        expect(denormalizedCase['demographics.nationalities']).toEqual('');
        expect(denormalizedCase['demographics.occupation']).toEqual('');
        expect(denormalizedCase['events.firstClinicalConsultation.date']).toEqual('');
        expect(denormalizedCase['events.onsetSymptoms.date']).toEqual('');
        expect(denormalizedCase['events.outcome.date']).toEqual('');
        expect(denormalizedCase['events.outcome.value']).toEqual('');
        expect(denormalizedCase['events.selfIsolation.date']).toEqual('');
        expect(denormalizedCase['events.confirmed.date']).toEqual('');
        expect(denormalizedCase['events.confirmed.value']).toEqual('');
        expect(denormalizedCase['events.hospitalAdmission.date']).toEqual('');
        expect(denormalizedCase['events.hospitalAdmission.value']).toEqual('');
        expect(denormalizedCase['events.icuAdmission.date']).toEqual('');
        expect(denormalizedCase['events.icuAdmission.value']).toEqual('');
        expect(denormalizedCase['location.country']).toEqual('');
        expect(denormalizedCase['location.administrativeAreaLevel1']).toEqual('');
        expect(denormalizedCase['location.administrativeAreaLevel2']).toEqual('');
        expect(denormalizedCase['location.administrativeAreaLevel3']).toEqual('');
        expect(denormalizedCase['location.geoResolution']).toEqual('');
        expect(denormalizedCase['location.geometry.latitude']).toEqual('');
        expect(denormalizedCase['location.geometry.longitude']).toEqual('');
        expect(denormalizedCase['location.name']).toEqual('');
        expect(denormalizedCase['location.place']).toEqual('');
        expect(denormalizedCase['location.query']).toEqual('');
        expect(denormalizedCase['pathogens']).toEqual('');
        expect(denormalizedCase['preexistingConditions.hasPreexistingConditions']).toEqual('');
        expect(denormalizedCase['preexistingConditions.values']).toEqual('');
        expect(denormalizedCase['revisionMetadata.creationMetadata.curator']).toEqual('');
        expect(denormalizedCase['revisionMetadata.creationMetadata.date']).toEqual('');
        expect(denormalizedCase['revisionMetadata.creationMetadata.notes']).toEqual('');
        expect(denormalizedCase['revisionMetadata.editMetadata.curator']).toEqual('');
        expect(denormalizedCase['revisionMetadata.editMetadata.date']).toEqual('');
        expect(denormalizedCase['revisionMetadata.editMetadata.notes']).toEqual('');
        expect(denormalizedCase['revisionMetadata.revisionNumber']).toEqual('');
        expect(denormalizedCase['symptoms.values']).toEqual('');
        expect(denormalizedCase['symptoms.status']).toEqual('');
        expect(denormalizedCase['transmission.linkedCaseIds']).toEqual('');
        expect(denormalizedCase['transmission.places']).toEqual('');
        expect(denormalizedCase['transmission.routes']).toEqual('');
        expect(denormalizedCase['travelHistory.travel.dateRange.end']).toEqual('');
        expect(denormalizedCase['travelHistory.travel.dateRange.start']).toEqual('');
        expect(denormalizedCase['travelHistory.travel.location.country']).toEqual('');
        expect(denormalizedCase['travelHistory.travel.location.name']).toEqual('');
        expect(denormalizedCase['travelHistory.travel.methods']).toEqual('');
        expect(denormalizedCase['travelHistory.travel.purpose']).toEqual('');
        expect(denormalizedCase['travelHistory.traveledPrior30Days']).toEqual('');
        expect(denormalizedCase['vaccines.0.batch']).toEqual('');
        expect(denormalizedCase['vaccines.0.date']).toEqual('');
        expect(denormalizedCase['vaccines.0.name']).toEqual('');
        expect(denormalizedCase['vaccines.0.sideEffects']).toEqual('');
        expect(denormalizedCase['vaccines.1.batch']).toEqual('');
        expect(denormalizedCase['vaccines.1.date']).toEqual('');
        expect(denormalizedCase['vaccines.1.name']).toEqual('');
        expect(denormalizedCase['vaccines.1.sideEffects']).toEqual('');
        expect(denormalizedCase['vaccines.2.batch']).toEqual('');
        expect(denormalizedCase['vaccines.2.date']).toEqual('');
        expect(denormalizedCase['vaccines.2.name']).toEqual('');
        expect(denormalizedCase['vaccines.2.sideEffects']).toEqual('');
        expect(denormalizedCase['vaccines.3.batch']).toEqual('');
        expect(denormalizedCase['vaccines.3.date']).toEqual('');
        expect(denormalizedCase['vaccines.3.name']).toEqual('');
        expect(denormalizedCase['vaccines.3.sideEffects']).toEqual('');
        expect(denormalizedCase['variantOfConcern']).toEqual('');
    });
    it('denormalizes case reference fields', () => {
        const caseRefDoc = {
            sourceId: 'a source id',
            sourceEntryId: 'a source entry id',
            sourceUrl: 'global.health',
            uploadIds: ['id a', 'id b'],
            verificationStatus: 'UNVERIFIED',
            additionalSources: [
                {sourceUrl: 'google.com'}, 
                {sourceUrl: 'ap.org'},
            ],
        } as CaseReferenceDocument;

        const caseDoc = {
            caseReference: caseRefDoc,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);

        expect(denormalizedCase['caseReference.sourceId']).toEqual('a source id');
        expect(denormalizedCase['caseReference.sourceEntryId']).toEqual('a source entry id');
        expect(denormalizedCase['caseReference.sourceUrl']).toEqual('global.health');
        expect(denormalizedCase['caseReference.uploadIds']).toEqual('id a,id b');
        expect(denormalizedCase['caseReference.verificationStatus']).toEqual('UNVERIFIED');
        expect(denormalizedCase['caseReference.additionalSources']).toEqual('google.com,ap.org');
    });
    it('denormalizes demographics fields', () => {
        const demographicsDoc = {
            ageRange: {
                start: 42,
                end: 50,
            },
            gender: 'Male',
            occupation: 'Anesthesiologist',
            nationalities: ['Georgian', 'Azerbaijani'],
            ethnicity: 'Caucasian',
        } as DemographicsDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: demographicsDoc,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);

        expect(denormalizedCase['demographics.ageRange.end']).toEqual(50);
        expect(denormalizedCase['demographics.ageRange.start']).toEqual(42);
        expect(denormalizedCase['demographics.ethnicity']).toEqual('Caucasian');
        expect(denormalizedCase['demographics.gender']).toEqual('Male');
        expect(denormalizedCase['demographics.nationalities']).toEqual('Georgian,Azerbaijani');
        expect(denormalizedCase['demographics.occupation']).toEqual('Anesthesiologist');
    });
    it('denormalizes events fields', () => {
        const consultEvent = {
            name: 'firstClinicalConsultation',
            dateRange: {
                start: '2020-11-01',
                end: '2020-11-02',
            }
        } as EventsDocument;

        const onsetEvent = {
            name: 'onsetSymptoms',
            dateRange: {
                start: '2020-10-01',
                end: '2020-10-02',
            }
        } as EventsDocument;

        const outcomeEvent = {
            name: 'outcome',
            dateRange: {
                start: '2020-12-01',
                end: '2020-12-02',
            },
            value: 'recovered',
        } as EventsDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [consultEvent, onsetEvent, outcomeEvent],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);

        expect(denormalizedCase['events.firstClinicalConsultation.date']).toEqual(consultEvent.dateRange.end);
        expect(denormalizedCase['events.onsetSymptoms.date']).toEqual(onsetEvent.dateRange.end);
        expect(denormalizedCase['events.outcome.date']).toEqual(outcomeEvent.dateRange.end);
        expect(denormalizedCase['events.outcome.value']).toEqual(outcomeEvent.value);
        expect(denormalizedCase['events.selfIsolation.date']).toEqual('');
        expect(denormalizedCase['events.confirmed.date']).toEqual('');
        expect(denormalizedCase['events.confirmed.value']).toEqual('');
        expect(denormalizedCase['events.hospitalAdmission.date']).toEqual('');
        expect(denormalizedCase['events.hospitalAdmission.value']).toEqual('');
        expect(denormalizedCase['events.icuAdmission.date']).toEqual('');
        expect(denormalizedCase['events.icuAdmission.value']).toEqual('');
    });
    it('denormalizes location fields', () => {
        const locationDoc = {
            country: 'Georgia',
            name: 'Tbilisi',
            geoResolution: 'Point',
            geometry: {
                latitude: 41.7151,
                longitude: 44.8271,
            },
        } as LocationDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: locationDoc,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);

        expect(denormalizedCase['location.country']).toEqual(locationDoc.country);
        expect(denormalizedCase['location.administrativeAreaLevel1']).toEqual('');
        expect(denormalizedCase['location.administrativeAreaLevel2']).toEqual('');
        expect(denormalizedCase['location.administrativeAreaLevel3']).toEqual('');
        expect(denormalizedCase['location.geoResolution']).toEqual(locationDoc.geoResolution);
        expect(denormalizedCase['location.geometry.latitude']).toEqual(locationDoc.geometry.latitude);
        expect(denormalizedCase['location.geometry.longitude']).toEqual(locationDoc.geometry.longitude);
        expect(denormalizedCase['location.name']).toEqual(locationDoc.name);
        expect(denormalizedCase['location.place']).toEqual('');
        expect(denormalizedCase['location.query']).toEqual('');
    });
    it('denormalizes pathogen fields', () => {
        const bacteriaDoc = {
            name: 'E. coli',
            id: '0',
        } as PathogenDocument;
        
        const virusDoc = {
            name: 'Influenza A',
            id: '1',
        } as PathogenDocument;

        const fungiDoc = {
            name: 'Aspergillosis',
            id: '2',
        } as PathogenDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [bacteriaDoc, virusDoc, fungiDoc],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);
        const pathogenNames = [bacteriaDoc.name, virusDoc.name, fungiDoc.name].join(',');
        expect(denormalizedCase['pathogens']).toEqual(pathogenNames);
    });
    it('denormalizes preexisting conditions fields', () => {
        const conditionsDoc = {
            values: ['Obesity', 'Diabetes'],
            hasPreexistingConditions: true,
        } as PreexistingConditionsDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: conditionsDoc,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);
        expect(denormalizedCase['preexistingConditions.hasPreexistingConditions']).toEqual(true);
        expect(denormalizedCase['preexistingConditions.values']).toEqual('Obesity,Diabetes');
    });
    it('denormalizes revision metadata fields', () => {
        const revisionDoc = {
            revisionNumber: 4,
            creationMetadata: {
                curator: 'Joe',
                date: '2020-05-01',
                notes: 'added more information',
            },
            updateMetadata: {
                curator: 'Jim',
                date: '2020-07-01',
                notes: 'removed some information',
            },
        } as RevisionMetadataDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: revisionDoc,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);
        
        expect(denormalizedCase['revisionMetadata.creationMetadata.curator']).toEqual('Joe');
        expect(denormalizedCase['revisionMetadata.creationMetadata.date']).toEqual('2020-05-01');
        expect(denormalizedCase['revisionMetadata.creationMetadata.notes']).toEqual('added more information');
        expect(denormalizedCase['revisionMetadata.editMetadata.curator']).toEqual('Jim');
        expect(denormalizedCase['revisionMetadata.editMetadata.date']).toEqual('2020-07-01');
        expect(denormalizedCase['revisionMetadata.editMetadata.notes']).toEqual('removed some information');
        expect(denormalizedCase['revisionMetadata.revisionNumber']).toEqual(4);
    });
    it('denormalizes symptoms fields', () => {
        const symptomsDoc = {
            values: ['Cough', 'Fever'],
            status: 'current',
        } as SymptomsDocument;
        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: symptomsDoc,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);

        expect(denormalizedCase['symptoms.values']).toEqual('Cough,Fever');
        expect(denormalizedCase['symptoms.status']).toEqual('current');
    });
    it('denormalizes transmission fields', () => {
        const transmissionDoc = {
            linkedCaseIds: ['0', '1', '2'],
            places: ['Tbilisi', 'Baku'],
            routes: ['train', 'plane']
        } as TransmissionDocument

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: transmissionDoc,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);
        
        expect(denormalizedCase['transmission.linkedCaseIds']).toEqual('0,1,2');
        expect(denormalizedCase['transmission.places']).toEqual('Tbilisi,Baku');
        expect(denormalizedCase['transmission.routes']).toEqual('train,plane');
    });
    it('denormalizes travel history fields', () => {
        const travelHistoryDoc = {
            travel: [{
                dateRange: {
                    start: '2020-05-01',
                    end: '2020-05-03',
                },
                location: {
                    country: 'Azerbaijan',
                    name: 'Baku',
                    geoResolution: 'Point',
                    geometry: {
                        latitude: 40.409,
                        longitude: 49.867,
                    }
                },
                methods: ['train', 'taxi'],
                purpose: 'business',
            },
            {
                dateRange: {
                    start: '2020-06-01',
                    end: '2020-06-03',
                },
                location: {
                    country: 'Russia',
                    name: 'Sochi',
                    geoResolution: 'Point',
                    geometry: {
                        latitude: 43.603,
                        longitude: 39.734,
                    }
                },
                methods: ['plane', 'taxi'],
                purpose: 'pleasure',
            }],
            traveledPrior30Days: true,
        } as TravelHistoryDocument

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: travelHistoryDoc,
            vaccines: [{} as VaccineDocument],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);
        
        expect(denormalizedCase['travelHistory.travel.dateRange.end']).toEqual('2020-05-03,2020-06-03');
        expect(denormalizedCase['travelHistory.travel.dateRange.start']).toEqual('2020-05-01,2020-06-01');
        expect(denormalizedCase['travelHistory.travel.location.country']).toEqual('Azerbaijan,Russia');
        expect(denormalizedCase['travelHistory.travel.location.name']).toEqual('Baku,Sochi');
        expect(denormalizedCase['travelHistory.travel.methods']).toEqual('train,taxi;plane,taxi');
        expect(denormalizedCase['travelHistory.travel.purpose']).toEqual('business,pleasure');
        expect(denormalizedCase['travelHistory.traveledPrior30Days']).toEqual(true);
    });
    it('denormalizes vaccine fields', () => {
        const firstVaccineDoc = {
            name: 'Pfizer',
            batch: 'TK421',
            date: '2021-03-01',
            sideEffects: {
                values: ['aches', 'chills'],
                status: 'mild',
            },
            previousInfection: 'no',
            previousInfectionDetectionMethod: 'visual',
        } as VaccineDocument;
        const secondVaccineDoc = {
            name: 'Pfizer',
            batch: 'TK422',
            date: '2021-05-01',
            sideEffects: {
                values: ['cough'],
                status: 'medium',
            },
            previousInfection: 'yes',
            previousInfectionDetectionMethod: 'swab',
        } as VaccineDocument;
        const boosterVaccineDoc = {
            name: 'Moderna',
            batch: 'TBD123',
            date: '2021-07-01',
            sideEffects: {
                values: [],
                status: 'n/a',
            },
            previousInfection: 'no',
            previousInfectionDetectionMethod: 'visual',
        } as VaccineDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [firstVaccineDoc, secondVaccineDoc, boosterVaccineDoc],
            variant: {} as VariantDocument,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);
        expect(denormalizedCase['vaccines.0.batch']).toEqual('TK421');
        expect(denormalizedCase['vaccines.0.date']).toEqual('2021-03-01');
        expect(denormalizedCase['vaccines.0.name']).toEqual('Pfizer');
        expect(denormalizedCase['vaccines.0.sideEffects']).toEqual('aches,chills');
        expect(denormalizedCase['vaccines.1.batch']).toEqual('TK422');
        expect(denormalizedCase['vaccines.1.date']).toEqual('2021-05-01');
        expect(denormalizedCase['vaccines.1.name']).toEqual('Pfizer');
        expect(denormalizedCase['vaccines.1.sideEffects']).toEqual('cough');
        expect(denormalizedCase['vaccines.2.batch']).toEqual('TBD123');
        expect(denormalizedCase['vaccines.2.date']).toEqual('2021-07-01');
        expect(denormalizedCase['vaccines.2.name']).toEqual('Moderna');
        expect(denormalizedCase['vaccines.2.sideEffects']).toEqual('');
        expect(denormalizedCase['vaccines.3.batch']).toEqual('');
        expect(denormalizedCase['vaccines.3.date']).toEqual('');
        expect(denormalizedCase['vaccines.3.name']).toEqual('');
        expect(denormalizedCase['vaccines.3.sideEffects']).toEqual('');
    });
    it('denormalizes variant fields', () => {
        const variantDoc = {
            name: 'Omicron',
        } as VariantDocument;

        const caseDoc = {
            caseReference: {} as CaseReferenceDocument,
            demographics: {} as DemographicsDocument,
            events: [{} as EventDocument],
            location: {} as LocationDocument,
            revisionMetadata: {} as RevisionMetadataDocument,
            pathogens: [{} as PathogenDocument],
            preexistingConditions: {} as PreexistingConditionsDocument,
            symptoms: {} as SymptomsDocument,
            transmission: {} as TransmissionDocument,
            travelHistory: {} as TravelHistoryDocument,
            vaccines: [{} as VaccineDocument],
            variant: variantDoc,
        } as CaseDocument;

        const denormalizedCase = denormalizeFields(caseDoc);
        
        expect(denormalizedCase['variantOfConcern']).toEqual('Omicron');
    });
});
