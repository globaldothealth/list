import { LocationDocument, locationSchema } from './location';
import {
    RevisionMetadataDocument,
    revisionMetadataSchema,
} from './revision-metadata';
import { SourceDocument, sourceSchema } from './source';

import { ObjectId } from 'mongodb';
import { dateFieldInfo } from './date';
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

const dateRangeSchema = new mongoose.Schema({
    start: dateFieldInfo,
    end: dateFieldInfo,
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
    ageRange: {
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
    species: {
        type: String,
        enum: Object.values(Species),
    },
    sex: {
        type: String,
        enum: Object.values(Sex),
    },
});

const outbreakSpecificsSchema = new mongoose.Schema({
    livesInWuhan: Boolean,
    reportedMarketExposure: Boolean,
});

const pathogenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Enter a pathogen name',
    },
    sequenceSource: sourceSchema,
    additionalInformation: String,
});

const travelSchema = new mongoose.Schema({
    location: locationSchema,
    dateRange: dateRangeSchema,
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
                    dateRange: dateRangeSchema,
                },
            ],
            validate: {
                validator: function (events: [Event]): boolean {
                    return events.some((e) => e.name == 'confirmed');
                },
                message: 'Must include an event with name "confirmed"',
            },
        },
        importedCase: {},
        location: locationSchema,
        revisionMetadata: {
            type: revisionMetadataSchema,
            required: 'Enter revision metadata',
        },
        notes: String,
        outbreakSpecifics: outbreakSpecificsSchema,
        pathogens: [pathogenSchema],
        source: sourceSchema,
        symptoms: dictionaryValueSchema,
        travelHistory: [travelSchema],
    },
    {
        strict: true,
        useNestedStrict: true,
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

interface Demographics {
    ageRange: Range<number>;
    sex: Sex;
    species: Species;
}

interface ChronicDisease {
    provided: [string];
    imputed: [string];
}

interface Event {
    name: string;
    dateRange: Range<Date>;
}

interface OutbreakSpecifics {
    livesInWuhan: boolean;
    reportedMarketExposure: boolean;
}

interface Pathogen {
    name: string;
    sequenceSource: SourceDocument;
    additionalInformation: string;
}

interface Symptoms {
    provided: [string];
    imputed: [string];
}

interface Travel {
    location: LocationDocument;
    dateRange: Range<Date>;
    purpose: TravelPurpose;
    additionalInformation: string;
}

type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    chronicDisease: ChronicDisease;
    demographics: Demographics;
    events: [Event];
    importedCase: {};
    location: LocationDocument;
    revisionMetadata: RevisionMetadataDocument;
    notes: string;
    outbreakSpecifics: OutbreakSpecifics;
    pathogens: [Pathogen];
    source: SourceDocument;
    symptoms: Symptoms;
    travelHistory: [Travel];
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
