import { CaseReferenceDocument, caseReferenceSchema } from './case-reference';
import { DemographicsDocument, demographicsSchema } from './demographics';
import { DictionaryDocument, dictionarySchema } from './dictionary';
import { EventDocument, eventSchema } from './event';
import {
    GenomeSequenceDocument,
    genomeSequenceSchema,
} from './genome-sequence';
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
        genomeSequences: [genomeSequenceSchema],
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
// We need to create an index on the schema case and can't use "text: true"
// annotations on individual fields as mongoose doesn't aggregate them all
// and only one field ends up being full-text-search compatible.
caseSchema.index(
    {
        notes: 'text',
        'revisionMetadata.creationMetadata.curator': 'text',
        'demographics.profession': 'text',
        'demographics.nationalities': 'text',
        'demographics.ethnicity': 'text',
        'location.country': 'text',
        'location.administrativeAreaLevel1': 'text',
        'location.administrativeAreaLevel2': 'text',
        'location.administrativeAreaLevel3': 'text',
        'location.place': 'text',
        'location.name': 'text',
        'pathogen.name': 'text',
        'sources.url': 'text',
    },
    {
        name: 'CasesFTSIndex',
    },
);

type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    caseReference: CaseReferenceDocument;
    demographics: DemographicsDocument;
    events: [EventDocument];
    genomeSequences: [GenomeSequenceDocument];
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
