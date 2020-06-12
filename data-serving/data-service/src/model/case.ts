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
import { TravelDocument, travelSchema } from './travel';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
    {
        chronicDisease: dictionarySchema,
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
        sources: {
            type: [sourceSchema],
            required: true,
            validate: {
                validator: (sources: [SourceDocument]) => sources.length > 0,
                message: 'Must include one or more sources',
            },
        },
        symptoms: dictionarySchema,
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

type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    chronicDisease: DictionaryDocument;
    demographics: DemographicsDocument;
    events: [EventDocument];
    importedCase: {};
    location: LocationDocument;
    revisionMetadata: RevisionMetadataDocument;
    notes: string;
    pathogens: [PathogenDocument];
    sources: [SourceDocument];
    symptoms: DictionaryDocument;
    travelHistory: [TravelDocument];
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
