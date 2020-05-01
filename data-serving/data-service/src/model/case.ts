import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

export enum Sex {
    Female = 'Female',
    Male = 'Male',
    Other = 'Other',
}

export enum Species {
    HomoSapien = 'Homo sapien',
}

export enum TravelPurpose {
    Family = 'Family',
    Conference = 'Conference',
    Work = 'Work',
}

const dateValidator = {
    type: Date,
    start: '2019-11-01',
    end: Date.now,
};

const dateRangeSchema = new mongoose.Schema({
    start: dateValidator,
    end: dateValidator,
});

const dictionaryValueSchema = new mongoose.Schema({
    provided: {
        type: [String],
        uniqueItems: true,
    },
    imputed: {
        type: [String],
        uniqueItems: true,
    },
});

const demographicsSchema = new mongoose.Schema({
    age: {
        range: {
            start: {
                type: Number,
                min: -1,
                max: 200,
            },
            end: {
                type: Number,
                min: 0,
                max: 200,
            },
        },
    },
    species: {
        type: String,
        enum: Object.values(Species),
    },
    sex: {
        type: String,
        enum: Object.values(Sex),
    },
});

const revisionMetadataSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: 'Enter a revision id',
    },
    moderator: {
        type: String,
        required: 'Enter a revision moderator id',
    },
    date: {
        ...dateValidator,
        ...{
            required: 'Enter a revision date',
        },
    },
    notes: String,
});

const outbreakSpecificsSchema = new mongoose.Schema({
    livesInWuhan: Boolean,
    reportedMarketExposure: Boolean,
});

const minimumSourceFieldsValidator = {
    validator: function (source: Source) {
        return !!source.id || !!source.url || !!source.other;
    },
    message: 'One of source.id, source.url, or source.other is required',
};

const sourceSchema = new mongoose.Schema({
    id: String,
    url: String,
    other: String,
});

const pathogenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Enter a pathogen name',
    },
    sequenceSource: {
        type: sourceSchema,
        validate: minimumSourceFieldsValidator,
    },
    additionalInformation: String,
});

const minimumLocationFieldsValidator = {
    validator: function (location: Location) {
        return (
            !!location.country ||
            !!location.administrativeAreaLevel1 ||
            !!location.administrativeAreaLevel2 ||
            !!location.locality
        );
    },
    message:
        'One of location.country, location.administrativeRegion1, ' +
        'location.administrativeRegion2, or locality is required',
};

const locationSchema = new mongoose.Schema({
    id: String,
    country: String,
    administrativeRegion1: String,
    administrativeRegion2: String,
    locality: String,
    geometry: {
        latitude: {
            type: Number,
            min: -90.0,
            max: 90.0,
        },
        longitude: {
            type: Number,
            min: -180.0,
            max: 180.0,
        },
    },
});

const travelSchema = new mongoose.Schema({
    location: {
        type: locationSchema,
        validate: minimumLocationFieldsValidator,
    },
    dates: dateRangeSchema,
    purpose: {
        type: String,
        enum: Object.values(TravelPurpose),
    },
    additionalInformation: String,
});

const caseSchema = new mongoose.Schema(
    {
        chronicDisease: dictionaryValueSchema,
        demographics: demographicsSchema,
        events: {
            type: [
                {
                    name: {
                        type: String,
                        required: 'Enter a name for the event',
                    },
                    date: dateRangeSchema,
                },
            ],
            validate: {
                validator: function (events: [Event]) {
                    return events.some((e) => e.name == 'confirmed');
                },
                message: 'Must include an event with name "confirmed"',
            },
        },
        importedCase: {},
        location: {
            type: locationSchema,
            required: 'Enter a location',
            validate: minimumLocationFieldsValidator,
        },
        revisionMetadata: {
            type: revisionMetadataSchema,
            required: 'Enter revision metadata',
        },
        notes: String,
        outbreakSpecifics: outbreakSpecificsSchema,
        pathogens: [pathogenSchema],
        source: {
            type: sourceSchema,
            required: 'Enter a source',
            validate: minimumSourceFieldsValidator,
        },
        symptoms: dictionaryValueSchema,
        travelHistory: [travelSchema],
    },
    {
        toObject: {
            transform: function (__, ret) {
                // TODO: Transform the model layer to the API layer.
                return ret;
            },
        },
        toJSON: {
            transform: function (__, ret) {
                // TODO: Transform the model layer to the API layer.
                return ret;
            },
        },
    },
);

interface Range<T> {
    start: T;
    end: T;
}

interface Age {
    range: Range<number>;
}

interface Demographics {
    age: Age;
    sex: Sex;
    species: Species;
}

interface ChronicDisease {
    provided: [string];
    imputed: [string];
}

interface EventDate {
    range: Range<Date>;
}

interface Event {
    name: string;
    date: EventDate;
}

interface Geometry {
    latitude: number;
    longitude: number;
}

interface Location {
    id: string;
    country: string;
    administrativeAreaLevel1: string;
    administrativeAreaLevel2: string;
    locality: string;
    geometry: Geometry;
}

interface RevisionMetadata {
    id: number;
    moderator: string;
    date: Date;
    notes: string;
}

interface OutbreakSpecifics {
    livesInWuhan: boolean;
    reportedMarketExposure: boolean;
}

interface Pathogen {
    name: string;
    sequenceSource: Source;
    additionalInformation: string;
}

interface Source {
    id: string;
    url: string;
    other: string;
}

interface Symptoms {
    provided: [string];
    imputed: [string];
}

interface TravelDates {
    range: Range<Date>;
}

interface Travel {
    location: Location;
    dates: TravelDates;
    purpose: TravelPurpose;
    additionalInformation: string;
}

type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    chronicDisease: ChronicDisease;
    demographics: Demographics;
    events: [Event];
    importedCase: {};
    location: Location;
    revisionMetadata: RevisionMetadata;
    notes: string;
    outbreakSpecifics: OutbreakSpecifics;
    pathogens: [Pathogen];
    source: Source;
    symptoms: Symptoms;
    travelHistory: [Travel];
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
