import { LocationDocument, locationSchema } from '../../src/model/location';

import { Error } from 'mongoose';
import mongoose from 'mongoose';

const Location = mongoose.model<LocationDocument>('Location', locationSchema);

/** A sample document with the minimim required fields. */
const minimalModel = {
    locality: 'Brooklyn',
};

describe('validate', () => {
    it('empty location is invalid', async () => {
        return new Location({}).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a location with only country is valid', async () => {
        return new Location({ country: 'United States' }).validate();
    });

    it('a location with only administrativeAreaLevel1 is valid', async () => {
        return new Location({
            administrativeAreaLevel1: 'New York',
        }).validate();
    });

    it('a location with only administrativeAreaLevel2 is valid', async () => {
        return new Location({
            administrativeAreaLevel2: 'Kings County',
        }).validate();
    });

    it('a location with only locality is valid', async () => {
        return new Location({ locality: 'Brooklyn' }).validate();
    });

    it('a latitude without a longitude is invalid', async () => {
        return new Location({
            ...minimalModel,
            geometry: {
                latitude: 40.6,
            },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a longitude without a latitude is invalid', async () => {
        return new Location({
            ...minimalModel,
            geometry: {
                longitude: -73.9,
            },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a fully specified location is valid', async () => {
        return new Location({
            id: 'abc',
            country: 'United States',
            administrativeAreaLevel1: 'New York',
            administrativeAreaLevel2: 'Kings County',
            locality: 'Brooklyn',
            geometry: {
                latitude: 40.6,
                longitude: -73.9,
            },
        }).validate();
    });

    it('validators work for embedded locations', async () => {
        const FakeModel = mongoose.model(
            'FakeDocument',
            new mongoose.Schema({
                location: locationSchema,
            }),
        );
        return new FakeModel({ location: {} }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });
});
