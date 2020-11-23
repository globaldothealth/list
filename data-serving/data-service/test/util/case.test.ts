import { CaseDocument } from '../../src/model/case';
import { EventDocument } from '../../src/model/event';
import { parseCaseEvents, parseDownloadedCase } from '../../src/util/case';
import events from '../model/data/case.events.json';
import demographics from '../model/data/demographics.full.json';
import symptoms from '../model/data/symptoms.full.json';

describe('Case', () => {
    it('is parsed properly for download', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Not necessary to mock full Mongoose type in JSON file
        const res = parseDownloadedCase({
            events,
            demographics,
            symptoms,
        } as CaseDocument);

        expect(res.events).toEqual({
            onsetSymptoms: {
                value: '',
                date: '2020-11-14T00:00:00.000Z',
            },
            confirmed: {
                value: 'PCR test',
                date: '2020-11-19T00:00:00.000Z',
            },
            hospitalAdmission: {
                value: '',
                date: '2020-11-20T00:00:00.000Z',
            },
            outcome: {
                value: 'Recovered',
                date: '2020-12-01T00:00:00.000Z',
            },
        });

        expect(res.demographics.nationalities).toEqual('American,Swedish');
        expect(res.symptoms.values).toEqual('Cough,Pneumonia');
    });
    it('events are parsed properly for download', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Not necessary to mock full Mongoose type in JSON file
        const res = parseCaseEvents(events as EventDocument[]);

        expect(res).toEqual({
            onsetSymptoms: {
                value: '',
                date: '2020-11-14T00:00:00.000Z',
            },
            confirmed: {
                value: 'PCR test',
                date: '2020-11-19T00:00:00.000Z',
            },
            hospitalAdmission: {
                value: '',
                date: '2020-11-20T00:00:00.000Z',
            },
            outcome: {
                value: 'Recovered',
                date: '2020-12-01T00:00:00.000Z',
            },
        });
    });
});
