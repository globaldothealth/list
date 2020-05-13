import mongoose from 'mongoose';

const fieldRequiredValidator = [
    function (this: LocationDocument): boolean {
        return (
            this != null &&
            this.country == null &&
            this.administrativeAreaLevel1 == null &&
            this.administrativeAreaLevel2 == null &&
            this.locality == null
        );
    },
    'One of location.country, location.administrativeRegion1, ' +
        'location.administrativeRegion2, or locality is required',
];

export const locationSchema = new mongoose.Schema(
    {
        id: String,
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
        locality: {
            type: String,
            required: fieldRequiredValidator,
        },
        geometry: {
            latitude: {
                type: Number,
                min: -90.0,
                max: 90.0,
                required: [
                    function (this: LocationDocument): boolean {
                        return (
                            this.geometry.latitude == null &&
                            this.geometry.longitude != null
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
                            this.geometry.longitude == null &&
                            this.geometry.latitude != null
                        );
                    },
                    'longitude must be specified if geometry is present',
                ],
            },
        },
    },
    { strict: true },
);

interface Geometry {
    latitude: number;
    longitude: number;
}

export type LocationDocument = mongoose.Document & {
    id: string;
    country: string;
    administrativeAreaLevel1: string;
    administrativeAreaLevel2: string;
    locality: string;
    geometry: Geometry;
};
