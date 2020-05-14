import { DateRangeDocument, dateRangeSchema } from './date-range';
import { DemographicsDocument, demographicsSchema } from './demographics';
import { LocationDocument, locationSchema } from './location';
import {
    RevisionMetadataDocument,
    revisionMetadataSchema,
} from './revision-metadata';
import { SourceDocument, sourceSchema } from './source';
import { TravelDocument, travelSchema } from './travel';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

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

interface ChronicDisease {
    provided: [string];
    imputed: [string];
}

interface Event {
    name: string;
    dateRange: DateRangeDocument;
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

type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    chronicDisease: ChronicDisease;
    demographics: DemographicsDocument;
    events: [Event];
    importedCase: {};
    location: LocationDocument;
    revisionMetadata: RevisionMetadataDocument;
    notes: string;
    outbreakSpecifics: OutbreakSpecifics;
    pathogens: [Pathogen];
    source: SourceDocument;
    symptoms: Symptoms;
    travelHistory: [TravelDocument];
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
