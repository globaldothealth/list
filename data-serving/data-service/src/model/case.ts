import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

export enum Sex {
    Female,
    Male,
    Other,
}

export enum Outcome {
    Pending,
    Recovered,
    Death,
}

export enum Species {
    HomoSapien,
}

export enum TravelPurpose {
    Family,
    Conference,
    Work,
}

const dateValidator = {
    type: Date,
    min: '2019-11-01',
    max: Date.now,
};

const ageRangeSchema = new mongoose.Schema({
    minimum: {
        type: Number,
        min: -1,
        max: 200,
    },
    maximum: {
        type: Number,
        min: 0,
        max: 200,
    },
});

const ageSchema = new mongoose.Schema({
    years: {
        type: Number,
        min: -0.75,
        max: 200,
    },
    range: ageRangeSchema,
});

const demographicsSchema = new mongoose.Schema({
    ageSchema,
    species: {
        type: String,
        enum: Object.keys(Species),
    },
    sex: {
        type: String,
        enum: Object.keys(Sex),
    },
});

const eventSequenceSchema = new mongoose.Schema({
    onsetSymptoms: dateValidator,
    confirmed: {
        ...dateValidator,
        ...{
            required: 'Enter a confirmation date',
        },
    },
    hospitalAdmission: dateValidator,
    deathOrDischarge: dateValidator,
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
    other: {
        type: [String],
        uniqueItems: true,
    },
});

const metadataSchema = new mongoose.Schema({
    moderatorId: {
        type: String,
        required: 'Enter a moderator id',
    },
    submissionDate: dateValidator,
});

const outbreakSpecificsSchema = new mongoose.Schema({
    livesInWuhan: Boolean,
    reportedMarketExposure: Boolean,
});

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
    sequenceSource: sourceSchema,
    additionalInformation: String,
});

const pathogensSchema = new mongoose.Schema({
    fields: [pathogenSchema],
});

const geometrySchema = new mongoose.Schema({
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
});

const locationSchema = new mongoose.Schema({
    id: String,

    country: {
        type: String,
        required: 'Enter a country',
    },
    administrativeRegion1: String,
    administrativeRegion2: String,

    locality: String,
    geometry: geometrySchema,
});

const dateRangeSchema = new mongoose.Schema({
    start: Date,
    end: Date,
});

const travelSchema = new mongoose.Schema({
    location: locationSchema,
    dates: dateRangeSchema,
    purpose: {
        type: String,
        enum: Object.keys(TravelPurpose),
    },
    additionalInformation: String,
});

const travelHistorySchema = new mongoose.Schema({
    fields: [travelSchema],
});

const caseSchema = new mongoose.Schema({
    chronicDisease: dictionaryValueSchema,
    demographics: demographicsSchema,
    eventSequence: {
        type: eventSequenceSchema,
        required: 'Enter an event sequence',
    },
    importedCase: Object,
    location: locationSchema,
    metadata: metadataSchema,
    notes: String,
    outbreakSpecifics: outbreakSpecificsSchema,
    outcome: {
        type: String,
        enum: Object.keys(Outcome),
        required: 'Enter an outcome.',
    },
    pathogens: pathogensSchema,
    source: sourceSchema,
    symptoms: dictionaryValueSchema,
    travelHistory: travelHistorySchema,
});

interface Range {
    min: number;
    max: number;
}

interface Age {
    years: number;
    range: Range;
}

interface Demographics {
    age: Age;
    sex: Sex;
    species: Species;
}

interface ChronicDisease {
    provided: [string];
    imputed: [string];
    other: [string];
}

interface EventSequence {
    onsetSymptoms: Date;
    confirmed: Date;
    hospitalAdmission: Date;
    deathOrDischarge: Date;
}

interface Geometry {
    latitude: number;
    longitude: number;
}

interface Location {
    id: string;
    country: string;
    administrativeRegion1: string;
    administrativeRegion2: string;
    locality: string;
    geometry: Geometry;
}

interface Metadata {
    moderatorId: string;
    submissionDate: Date;
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
    other: [string];
}

interface DateRange {
    start: Date;
    end: Date;
}

interface Travel {
    location: Location;
    dates: DateRange;

    purpose: TravelPurpose;

    additionalInformation: string;
}

type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    chronicDisease: ChronicDisease;
    demographics: Demographics;
    eventSequence: EventSequence;
    importedCase: {};
    location: Location;
    metadata: Metadata;
    notes: string;
    outbreakSpecifics: OutbreakSpecifics;
    outcome: Outcome;
    pathogens: [Pathogen];
    source: Source;
    symptoms: Symptoms;
    travelHistory: [Travel];
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
