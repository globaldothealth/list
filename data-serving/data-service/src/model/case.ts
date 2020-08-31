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
import _ from 'lodash';
import mongoose from 'mongoose';

export const caseSchema = new mongoose.Schema(
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
        importedCase: {
            _id: false,
        },
        location: locationSchema,
        revisionMetadata: revisionMetadataSchema,
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

/**
 * Determines if a provided JSON-representation case is equivalent to the
 * document.
 *
 * @remarks
 * This is a _semantic_ equivalence. We intentionally don't check book-keeping
 * data (like revisionMetadata) -- we strictly want to know if the content has
 * changed.
 *
 * @param jsonCase - JSON object representing a case document.
 * @returns Whether or not the provided JSON is equivalent.
 */
// TODO: Type request Cases.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
caseSchema.methods.equalsJSON = function (jsonCase: any): boolean {
    const thisJson = this.toJSON();
    const other = new Case(jsonCase).toJSON();
    return (
        _.isEqual(thisJson.demographics, other.demographics) &&
        _.isEqual(thisJson.events, other.events) &&
        _.isEqual(thisJson.genomeSequences, other.genomeSequences) &&
        _.isEqual(thisJson.location, other.location) &&
        _.isEqual(thisJson.notes, other.notes) &&
        _.isEqual(thisJson.pathogens, other.pathogens) &&
        _.isEqual(
            thisJson.preexistingConditions,
            other.preexistingConditions,
        ) &&
        _.isEqual(thisJson.symptoms, other.symptoms) &&
        _.isEqual(thisJson.transmission, other.transmission) &&
        _.isEqual(thisJson.travelHistory, other.travelHistory)
    );
};

export type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    caseReference: CaseReferenceDocument;
    demographics: DemographicsDocument;
    events: [EventDocument];
    genomeSequences: [GenomeSequenceDocument];
    importedCase: unknown;
    location: LocationDocument;
    revisionMetadata: RevisionMetadataDocument;
    notes: string;
    pathogens: [PathogenDocument];
    preexistingConditions: PreexistingConditionsDocument;
    symptoms: SymptomsDocument;
    transmission: TransmissionDocument;
    travelHistory: TravelHistoryDocument;

    // TODO: Type request Cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    equalsJSON(jsonCase: any): boolean;
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
