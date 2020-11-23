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
                date: dateRange.start, // dateRange.start and dateRange.end have always the same values
            },
        }),
        {},
    );

/**
 * Converts case to fulfill CSV file structure requirements.
 */
export const parseDownloadedCase = (caseDocument: CaseDocument) => ({
    ...caseDocument,
    events: parseCaseEvents(caseDocument.events),
    demographics: {
        ...caseDocument.demographics,
        nationalities: caseDocument.demographics.nationalities.join(','),
    },
    symptoms: {
        ...caseDocument.symptoms,
        values: caseDocument.symptoms.values.join(','),
    },
});
