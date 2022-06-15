import { CaseDocument, CaseDTO } from '../model/case';
import { CaseReferenceDocument } from '../model/case-reference';
import { demographicsAgeRange, DemographicsDocument } from '../model/demographics';
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

import _ from 'lodash';

const validEvents = [
    'firstClinicalConsultation',
    'onsetSymptoms',
    'selfIsolation',
    'confirmed',
    'hospitalAdmission',
    'icuAdmission',
    'outcome',
];
const dateOnlyEvents = [
    'firstClinicalConsultation',
    'onsetSymptoms',
    'selfIsolation',
];

/**
 * Converts event list to object to make a column for every event in csv file.
 *
 * Input: [{ name: 'confirmed', value: 'PCR test', dateRange: { start: '2020-11-19T00:00:00.000Z', end: '2020-11-19T00:00:00.000Z' } }]
 * Output: { confirmed: { value: 'PCR test', date: '2020-11-19T00:00:00.000Z' } }
 */
export const parseCaseEvents = (
    events: EventDocument[],
): {
    [name: string]: {
        value?: string;
        date?: Date;
    };
} =>
    events.reduce(
        (agg, { name, value, dateRange }: EventDocument) => ({
            ...agg,
            [name]: {
                value: value ?? '',
                date: dateRange
                    ? new Date(dateRange.start).toISOString().split('T')[0]
                    : null, // dateRange.start and dateRange.end have always the same values
            },
        }),
        {},
    );

/**
 * Converts case to fulfill CSV file structure requirements.
 */
export const parseDownloadedCase = (caseDocument: CaseDTO) => {
    const { demographics, symptoms } = caseDocument;

    const parsedDemographics = demographics?.nationalities
        ? {
              demographics: {
                  ...demographics,
                  nationalities: demographics.nationalities?.length
                      ? demographics.nationalities.join(',')
                      : '',
              },
          }
        : {};

    const parsedSymptoms = symptoms?.values
        ? {
              symptoms: {
                  ...symptoms,
                  values: symptoms.values?.length
                      ? symptoms.values.join(',')
                      : '',
              },
          }
        : {};

    return {
        ...caseDocument,
        ...parsedDemographics,
        ...parsedSymptoms,
        events: parseCaseEvents(caseDocument.events),
    };
};

/**
 * Enum with possible sortBy keywords
 */
export enum SortBy {
    Default = 'default',
    ConfirmationDate = 'confirmationDate',
    Country = 'country',
    Admin1 = 'admin1',
    Admin2 = 'admin2',
    Admin3 = 'admin3',
    Age = 'age',
}

/**
 * Sorting order
 */
export enum SortByOrder {
    Ascending = 'ascending',
    Descending = 'descending',
}

/**
 * Returns correct keyword to sort by
 */
export const getSortByKeyword = (sortBy: SortBy): string => {
    let keyword: string;

    switch (sortBy) {
        case SortBy.ConfirmationDate:
            keyword = 'confirmationDate';
            break;
        case SortBy.Country:
            keyword = 'location.country';
            break;
        case SortBy.Admin1:
            keyword = 'location.administrativeAreaLevel1';
            break;
        case SortBy.Admin2:
            keyword = 'location.administrativeAreaLevel2';
            break;
        case SortBy.Admin3:
            keyword = 'location.administrativeAreaLevel3';
            break;
        case SortBy.Age:
            keyword = 'demographics.ageRange.start';
            break;
        default:
            keyword = 'revisionMetadata.creationMetadata.date';
            break;
    }

    return keyword;
};

export const denormalizeEventsHeaders = (headers: string[]): string[] => {
    const index = headers.indexOf('events');
    if (index !== -1) {
        headers.splice(index, 1);
    }

    for (const name of validEvents) {
        headers.push(`events.${name}.date`);
        if (dateOnlyEvents.indexOf(name) === -1) {
            headers.push(`events.${name}.value`);
        }
    }

    return headers;
};

export const removeBlankHeader = (headers: string[]): string[] => {
    const index = headers.indexOf('');
    if (index !== -1) {
        headers.splice(index, 1);
    }
    return headers;
};

export const denormalizeFields = async (doc: CaseDocument): Promise<Partial<CaseDocument>> => {
    const caseReferenceFields = denormalizeCaseReferenceFields(
        doc.caseReference,
    );
    const demographicsFields = await denormalizeDemographicsFields(doc.demographics);
    const eventFields = denormalizeEventsFields(doc.events);
    const locationFields = denormalizeLocationFields(doc.location);
    const pathogenFields = denormalizePathogenFields(doc.pathogens);
    const preexistingConditionsFields = denormalizePreexistingConditionsFields(
        doc.preexistingConditions,
    );
    const revisionMetadataFields = denormalizeRevisionMetadataFields(
        doc.revisionMetadata,
    );
    const symptomsFields = denormalizeSymptomsFields(doc.symptoms);
    const transmissionFields = denormalizeTransmissionFields(doc.transmission);
    const travelHistoryFields = denormalizeTravelHistoryFields(
        doc.travelHistory,
    );
    const vaccineHistory = denormalizeVaccineFields(doc.vaccines);
    const variantFields = denormalizeVariantFields(doc.variant);

    const nestedFields = [
        'caseReference',
        'demographics',
        'events',
        'location',
        'pathogens',
        'preexistingConditions',
        'revisionMetadata',
        'symptoms',
        'transmission',
        'travelHistory',
        'vaccines',
        'variant',
    ];

    const undesiredFields = ['list', 'importedCase'];

    const flatFields = [
        caseReferenceFields,
        demographicsFields,
        eventFields,
        locationFields,
        pathogenFields,
        preexistingConditionsFields,
        revisionMetadataFields,
        symptomsFields,
        transmissionFields,
        travelHistoryFields,
        vaccineHistory,
        variantFields,
    ];

    let denormalizedDocument = _.omit(doc, nestedFields);
    denormalizedDocument = _.omit(denormalizedDocument, undesiredFields);
    // add denormalized fields to object
    for (const fields of flatFields) {
        denormalizedDocument = Object.assign(denormalizedDocument, fields);
    }

    return denormalizedDocument;
};

function denormalizeCaseReferenceFields(
    doc: CaseReferenceDocument,
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};
    const additionalSources: string[] = [];
    if (doc.hasOwnProperty('additionalSources')) {
        for (const source of doc.additionalSources || []) {
            additionalSources.push(source.sourceUrl);
        }
    }
    denormalizedData[
        'caseReference.additionalSources'
    ] = additionalSources.join(',');
    denormalizedData['caseReference.sourceEntryId'] = doc.sourceEntryId || '';
    denormalizedData['caseReference.sourceId'] = doc.sourceId || '';
    denormalizedData['caseReference.sourceUrl'] = doc.sourceUrl || '';
    const uploadIds =
        doc.uploadIds === undefined ? '' : doc.uploadIds.join(',');
    denormalizedData['caseReference.uploadIds'] = '';
    denormalizedData['caseReference.uploadIds'] = uploadIds;
    denormalizedData['caseReference.verificationStatus'] =
        doc.verificationStatus || '';
    return denormalizedData;
}

async function denormalizeDemographicsFields(
    doc: DemographicsDocument,
): Promise<Record<string, string | number>> {
    const denormalizedData: Record<string, string | number> = {};
    const ageRange = await demographicsAgeRange(doc);
    denormalizedData['demographics.ageRange.end'] = ageRange?.end || '';
    denormalizedData['demographics.ageRange.start'] = ageRange?.start || '';
    denormalizedData['demographics.ethnicity'] = doc.ethnicity || '';
    denormalizedData['demographics.gender'] = doc.gender || '';
    const nationalities =
        doc.nationalities === undefined ? '' : doc.nationalities.join(',');
    denormalizedData['demographics.nationalities'] = nationalities;
    denormalizedData['demographics.occupation'] = doc.occupation || '';
    return denormalizedData;
}

export const denormalizeEventsFields = (
    docs: [EventDocument],
): Record<string, string> => {
    const denormalizedData: Record<string, string> = {};

    for (const event of docs) {
        if (validEvents.indexOf(event.name) !== -1) {
            const end =
                event.dateRange?.end === undefined
                    ? ''
                    : event.dateRange.end.toString();
            denormalizedData[`events.${event.name}.date`] = end;
            if (dateOnlyEvents.indexOf(event.name) === -1) {
                denormalizedData[`events.${event.name}.value`] =
                    event.value || '';
            }
        }
    }
    for (const event of validEvents) {
        let field = `events.${event}.date`;
        if (!(field in denormalizedData)) {
            denormalizedData[field] = '';
        }
        field = `events.${event}.value`;
        if (
            !(field in denormalizedData) &&
            dateOnlyEvents.indexOf(field) === -1
        ) {
            denormalizedData[field] = '';
        }
    }
    return denormalizedData;
};

function denormalizeLocationFields(
    doc: LocationDocument,
): Record<string, string | number> {
    const denormalizedData: Record<string, string | number> = {};

    denormalizedData['location.administrativeAreaLevel1'] =
        doc.administrativeAreaLevel1 || '';
    denormalizedData['location.administrativeAreaLevel2'] =
        doc.administrativeAreaLevel1 || '';
    denormalizedData['location.administrativeAreaLevel3'] =
        doc.administrativeAreaLevel1 || '';
    denormalizedData['location.country'] = doc.country || '';
    denormalizedData['location.geoResolution'] = doc.geoResolution || '';
    denormalizedData['location.geometry.latitude'] =
        doc.geometry?.latitude || '';
    denormalizedData['location.geometry.longitude'] =
        doc.geometry?.longitude || '';
    denormalizedData['location.name'] = doc.name || '';
    denormalizedData['location.place'] = doc.place || '';
    denormalizedData['location.query'] = doc.query || '';
    return denormalizedData;
}

function denormalizePathogenFields(
    docs: [PathogenDocument],
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};
    const pathogens = [];
    if (docs !== undefined) {
        for (const doc of docs) {
            pathogens.push(doc.name);
        }
    }
    denormalizedData['pathogens'] = pathogens.join(',');
    return denormalizedData;
}

function denormalizePreexistingConditionsFields(
    doc: PreexistingConditionsDocument,
): Record<string, string | boolean> {
    const denormalizedData: Record<string, string | boolean> = {};

    denormalizedData['preexistingConditions.hasPreexistingConditions'] =
        doc?.hasPreexistingConditions || '';
    if (doc === undefined) {
        denormalizedData['preexistingConditions.values'] = '';
    } else {
        const values = doc.values === undefined ? '' : doc.values.join(',');
        denormalizedData['preexistingConditions.values'] = values;
    }
    return denormalizedData;
}

function denormalizeRevisionMetadataFields(
    doc: RevisionMetadataDocument,
): Record<string, string | number> {
    const denormalizedData: Record<string, string | number> = {};

    denormalizedData['revisionMetadata.creationMetadata.curator'] =
        doc.creationMetadata?.curator || '';
    denormalizedData['revisionMetadata.creationMetadata.date'] =
        doc.creationMetadata?.date?.toString() || '';
    denormalizedData['revisionMetadata.creationMetadata.notes'] =
        doc.creationMetadata?.notes || '';
    denormalizedData['revisionMetadata.editMetadata.curator'] =
        doc.updateMetadata?.curator || '';
    denormalizedData['revisionMetadata.editMetadata.date'] =
        doc.updateMetadata?.date.toString() || '';
    denormalizedData['revisionMetadata.editMetadata.notes'] =
        doc.updateMetadata?.notes || '';
    denormalizedData['revisionMetadata.revisionNumber'] =
        doc.revisionNumber || '';
    return denormalizedData;
}

function denormalizeSymptomsFields(
    doc: SymptomsDocument,
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};

    denormalizedData['symptoms.status'] = doc?.status || '';
    if (doc === undefined) {
        denormalizedData['symptoms.values'] = '';
    } else {
        const values = doc.values === undefined ? '' : doc.values.join(',');
        denormalizedData['symptoms.values'] = values;
    }
    return denormalizedData;
}

function denormalizeTransmissionFields(
    doc: TransmissionDocument,
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};

    if (doc === undefined) {
        denormalizedData['transmission.linkedCaseIds'] = '';
        denormalizedData['transmission.places'] = '';
        denormalizedData['transmission.routes'] = '';
    } else {
        const linkedCaseIds =
            doc.linkedCaseIds === undefined ? '' : doc.linkedCaseIds.join(',');
        denormalizedData['transmission.linkedCaseIds'] = linkedCaseIds;
        const places = doc.places === undefined ? '' : doc.places.join(',');
        denormalizedData['transmission.places'] = places;
        const routes = doc.routes === undefined ? '' : doc.routes.join(',');
        denormalizedData['transmission.routes'] = routes;
    }
    return denormalizedData;
}

function denormalizeTravelHistoryFields(
    doc: TravelHistoryDocument,
): Record<string, string | boolean> {
    const denormalizedData: Record<string, string | boolean> = {};

    const dateEnds = [];
    const dateStarts = [];
    const location_names = [];
    const location_countries = [];
    const methods = [];
    const purposes = [];

    if (doc !== undefined && doc.hasOwnProperty('travel')) {
        for (const travelDoc of doc.travel) {
            dateEnds.push(travelDoc.dateRange?.end || '');
            dateStarts.push(travelDoc.dateRange?.start || '');
            location_names.push(travelDoc.location?.name || '');
            location_countries.push(travelDoc.location?.country || '');
            const latitude = travelDoc.location?.geometry?.latitude || '';
            const longitude = travelDoc.location?.geometry?.longitude || '';
            const coordinates = `(${latitude},${longitude})`;
            const travelMethods =
                travelDoc.methods === undefined
                    ? ''
                    : travelDoc.methods.join(',');
            methods.push(travelMethods);
            purposes.push(travelDoc.purpose || '');
        }
    }

    denormalizedData['travelHistory.travel.dateRange.end'] = dateEnds.join(',');
    denormalizedData['travelHistory.travel.dateRange.start'] = dateStarts.join(
        ',',
    );
    denormalizedData[
        'travelHistory.travel.location.country'
    ] = location_countries.join(',');
    denormalizedData[
        'travelHistory.travel.location.name'
    ] = location_names.join(',');
    denormalizedData['travelHistory.travel.methods'] = methods.join(';');
    denormalizedData['travelHistory.travel.purpose'] = purposes.join(',');

    denormalizedData['travelHistory.traveledPrior30Days'] =
        doc?.traveledPrior30Days || '';
    return denormalizedData;
}

function denormalizeVaccineFields(
    docs: [VaccineDocument],
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};

    for (let i = 0; i < 4; i++) {
        if (docs === undefined || docs[i] === undefined) {
            denormalizedData[`vaccines.${i}.batch`] = '';
            denormalizedData[`vaccines.${i}.date`] = '';
            denormalizedData[`vaccines.${i}.name`] = '';
            denormalizedData[`vaccines.${i}.sideEffects`] = '';
        } else {
            const doc = docs[i];
            denormalizedData[`vaccines.${i}.batch`] = doc.batch || '';
            denormalizedData[`vaccines.${i}.date`] = doc.date?.toString() || '';
            denormalizedData[`vaccines.${i}.name`] = doc.name || '';
            const sideEffects =
                doc.sideEffects === undefined
                    ? ''
                    : doc.sideEffects.values?.join(',') || '';
            denormalizedData[`vaccines.${i}.sideEffects`] = sideEffects;
        }
    }
    return denormalizedData;
}

function denormalizeVariantFields(
    doc: VariantDocument,
): Record<string, string> {
    const denormalizedData: Record<string, string> = {};
    denormalizedData['variantOfConcern'] = doc?.name || '';
    return denormalizedData;
}
