import { CaseReferenceDocument, caseReferenceSchema } from './case-reference';
import { DemographicsDocument, demographicsSchema } from './demographics';
import { DictionaryDocument, dictionarySchema } from './dictionary';
import { EventDocument, eventSchema } from './event';
import { LocationDocument, locationSchema } from './location';
import { PathogenDocument, pathogenSchema } from './pathogen';
import {
    RevisionMetadataDocument,
    revisionMetadataSchema,
} from './revision-metadata';
import { SourceDocument, sourceSchema } from './source';
import { TransmissionDocument, transmissionSchema } from './transmission';
import { TravelHistoryDocument, travelHistorySchema } from './travel-history';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
    {
        caseReference: caseReferenceSchema,
        demographics: demographicsSchema,
        events: {
            type: [eventSchema],
            required: true,
            validate: {
                validator: (events: [EventDocument]) =>
                    events.some((e) => e.name == 'confirmed'),
                message: 'Must include an event with name "confirmed"',
            },
        },
        importedCase: {},
        location: locationSchema,
        revisionMetadata: {
            type: revisionMetadataSchema,
            required: 'Must include revision metadata',
        },
        notes: String,
        pathogens: [pathogenSchema],
        preexistingConditions: dictionarySchema,
        sources: {
            type: [sourceSchema],
            required: true,
            validate: {
                validator: (sources: [SourceDocument]) => sources.length > 0,
                message: 'Must include one or more sources',
            },
        },
        symptoms: dictionarySchema,
        transmission: transmissionSchema,
        travelHistory: travelHistorySchema,
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

type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    caseReference: CaseReferenceDocument;
    demographics: DemographicsDocument;
    events: [EventDocument];
    importedCase: {};
    location: LocationDocument;
    revisionMetadata: RevisionMetadataDocument;
    notes: string;
    pathogens: [PathogenDocument];
    preexistingConditions: DictionaryDocument;
    sources: [SourceDocument];
    symptoms: DictionaryDocument;
    transmission: TransmissionDocument;
    travelHistory: TravelHistoryDocument;
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
