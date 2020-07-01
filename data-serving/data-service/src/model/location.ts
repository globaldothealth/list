import mongoose from 'mongoose';

// See https://en.wikipedia.org/wiki/List_of_administrative_divisions_by_country
// for an explanation of each level of resolution.
export enum GeoResolution {
    Point = 'Point',
    Admin3 = 'Admin3',
    Admin2 = 'Admin2',
    Admin1 = 'Admin1',
    Country = 'Country',
}

const fieldRequiredValidator = [
    function (this: LocationDocument): boolean {
        return (
            this != null &&
            this.country == null &&
            this.administrativeAreaLevel1 == null &&
            this.administrativeAreaLevel2 == null &&
            this.administrativeAreaLevel3 == null
        );
    },
    'One of country, administrativeAreaLevel1, administrativeAreaLevel2, ' +
        'or administrativeAreaLevel3 is required',
];

export const locationSchema = new mongoose.Schema(
    {
        country: {
            type: String,
            required: fieldRequiredValidator,
        },
        administrativeAreaLevel1: {
            type: String,
            required: fieldRequiredValidator,
        },
        administrativeAreaLevel2: {
            type: String,
            required: fieldRequiredValidator,
        },
        administrativeAreaLevel3: {
            type: String,
            required: fieldRequiredValidator,
        },
        // Place represents a precise location, such as an establishment or POI.
        place: String,
        // A human-readable name of the location.
        name: String,
        geoResolution: {
            type: String,
            enum: Object.values(GeoResolution),
            required: true,
        },
        geometry: {
            latitude: {
                type: Number,
                min: -90.0,
                max: 90.0,
                required: [
                    function (this: LocationDocument): boolean {
                        return (
                            this != null &&
                            this.geometry?.latitude == null &&
                            this.geometry?.longitude != null
                        );
                    },
                    'latitude must be specified if geometry is present',
                ],
            },
            longitude: {
                type: Number,
                min: -180.0,
                max: 180.0,
                required: [
                    function (this: LocationDocument): boolean {
                        return (
                            this != null &&
                            this.geometry?.longitude == null &&
                            this.geometry?.latitude != null
                        );
                    },
                    'longitude must be specified if geometry is present',
                ],
            },
            _id: false,
        },
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
    geoResolution: GeoResolution;
    geometry?: Geometry;
};
