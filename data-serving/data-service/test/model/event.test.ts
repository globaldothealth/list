import { EventDocument, eventSchema } from '../../src/model/event';

import { Error } from 'mongoose';
import fullModel from './data/event.full.json';
import minimalModel from './data/event.minimal.json';
import mongoose from 'mongoose';

const Event = mongoose.model<EventDocument>('Event', eventSchema);

describe('validate', () => {
    it('a event without a name is invalid', async () => {
        const missingName: any = { ...minimalModel };
        delete missingName.name;

        return new Event(missingName).validate((e) => {
            expect(e).not.toBeNull();
            if (e) expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal event is valid', async () => {
        return new Event(minimalModel).validate();
    });

    it('a fully specified event is valid', async () => {
        return new Event(fullModel).validate();
    });
});
