import { CaseReferenceDocument, caseReferenceSchema } from './case-reference';
import { DemographicsDocument, demographicsSchema } from './demographics';
import { EventDocument, eventSchema } from './event';
import {
    GenomeSequenceDocument,
    genomeSequenceSchema,
} from './genome-sequence';
import { LocationDocument, locationSchema } from './location';
import { PathogenDocument, pathogenSchema } from './pathogen';
import {
    PreexistingConditionsDocument,
    preexistingConditionsSchema,
} from './preexisting-conditions';
import {
    RevisionMetadataDocument,
    revisionMetadataSchema,
} from './revision-metadata';
import { SymptomsDocument, symptomsSchema } from './symptoms';
import { TransmissionDocument, transmissionSchema } from './transmission';
import { TravelHistoryDocument, travelHistorySchema } from './travel-history';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
    {
        caseReference: {
            type: caseReferenceSchema,
            required: true,
        },
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
            required: true,
        },
        notes: String,
        pathogens: [pathogenSchema],
        preexistingConditions: preexistingConditionsSchema,
        symptoms: symptomsSchema,
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
    genomeSequences: [GenomeSequenceDocument];
    importedCase: {};
    location: LocationDocument;
    revisionMetadata: RevisionMetadataDocument;
    notes: string;
    pathogens: [PathogenDocument];
    preexistingConditions: PreexistingConditionsDocument;
    symptoms: SymptomsDocument;
    transmission: TransmissionDocument;
    travelHistory: TravelHistoryDocument;
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
