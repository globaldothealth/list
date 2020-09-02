import { LocationDocument, locationSchema } from '../../src/model/location';

import { Error } from 'mongoose';
import fullModel from './data/location.full.json';
import minimalModel from './data/location.minimal.json';
import mongoose from 'mongoose';

const Location = mongoose.model<LocationDocument>('Location', locationSchema);

describe('validate', () => {
    it('a location without a geo resolution is invalid', async () => {
        const noGeoResolution = { ...minimalModel };
        delete noGeoResolution.geoResolution;

        return new Location(noGeoResolution).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a location without a geometry is invalid', async () => {
        const noGeometry = { ...minimalModel };
        delete noGeometry.geometry;

        return new Location(noGeometry).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a location without a name is invalid', async () => {
        const noName = { ...minimalModel };
        delete noName.name;

        return new Location(noName).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a geometry without a longitude is invalid', async () => {
        return new Location({
            ...minimalModel,
            geometry: {
                latitude: 40.6,
            },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a geometry without a latitude is invalid', async () => {
        return new Location({
            ...minimalModel,
            geometry: {
                longitude: -73.9,
            },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal location is valid', async () => {
        return new Location(minimalModel).validate();
    });

    it('a fully specified location is valid', async () => {
        return new Location(fullModel).validate();
    });
});
