import { CaseDocument } from '../model/case';
import { EventDocument } from '../model/event';

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
        date: Date;
    };
} =>
    events.reduce(
        (agg, { name, value, dateRange }: EventDocument) => ({
            ...agg,
            [name]: {
                value: value ?? '',
                date: new Date(dateRange.start).toISOString().split('T')[0], // dateRange.start and dateRange.end have always the same values
            },
        }),
        {},
    );

/**
 * Converts case to fulfill CSV file structure requirements.
 */
export const parseDownloadedCase = (caseDocument: CaseDocument) => {
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
    Default,
    ConfirmedDate,
    Country,
    Admin1,
    Admin2,
    Admin3,
    Age,
}

/**
 * Sorting order
 */
export enum SortByOrder {
    Ascending,
    Descending,
}

/**
 * Returns correct keyword to sort by
 */
export const getSortByKeyword = (sortBy: SortBy): string => {
    let keyword: string;

    switch (sortBy) {
        case SortBy.ConfirmedDate:
            keyword = 'events.0.dateRange.start';
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
