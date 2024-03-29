import mongoose from 'mongoose';

const geometrySchema = new mongoose.Schema(
    {
        latitude: {
            type: Number,
            min: -90.0,
            max: 90.0,
            required: true,
        },
        longitude: {
            type: Number,
            min: -180.0,
            max: 180.0,
            required: true,
        },
    },
    { _id: false },
);

export const locationSchema = new mongoose.Schema(
    {
        country: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 2,
        },
        administrativeAreaLevel1: String,
        administrativeAreaLevel2: String,
        administrativeAreaLevel3: String,
        // Place represents a precise location, such as an establishment or POI.
        place: String,
        // A human-readable name of the location.
        name: {
            type: String,
            required: true,
        },
        geoResolution: {
            type: String,
            required: true,
        },
        geometry: {
            type: geometrySchema,
            required: true,
        },
        query: String,
    },
    { _id: false },
);

export const fuzzyLocationSchema = new mongoose.Schema(
    {
        country: String,
        administrativeAreaLevel1: String,
        administrativeAreaLevel2: String,
        administrativeAreaLevel3: String,
        // Place represents a precise location, such as an establishment or POI.
        place: String,
        // A human-readable name of the location.
        name: String,
        geoResolution: String,
        geometry: geometrySchema,
        query: String,
    },
    { _id: false },
);

interface Geometry {
    latitude: number;
    longitude: number;
}

export type LocationDocument = mongoose.Document & {
    country: string;
    administrativeAreaLevel1?: string;
    administrativeAreaLevel2?: string;
    administrativeAreaLevel3?: string;
    place?: string;
    name: string;
    geoResolution: string;
    geometry?: Geometry;
    query?: string;
};

export type FuzzyLocationDocument = mongoose.Document & {
    country?: string;
    administrativeAreaLevel1?: string;
    administrativeAreaLevel2?: string;
    administrativeAreaLevel3?: string;
    place?: string;
    name?: string;
    geoResolution?: string;
    geometry?: Geometry;
    query?: string;
};
