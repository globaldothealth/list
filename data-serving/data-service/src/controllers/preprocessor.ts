import { Case, CaseDocument } from '../model/case';
import { CaseRevision, CaseRevisionDocument } from '../model/case-revision';
import { NextFunction, Request, Response } from 'express';

import { findCasesWithCaseReferenceData } from './case';

const createNewMetadata = (curatorEmail: string) => {
    return {
        revisionNumber: 0,
        creationMetadata: {
            curator: curatorEmail,
            date: Date.now(),
        },
    };
};

const createUpdateMetadata = (c: CaseDocument, curatorEmail: string) => {
    return {
        revisionNumber: ++c.revisionMetadata.revisionNumber,
        creationMetadata: {
            curator: c.revisionMetadata.creationMetadata.curator,
            date: c.revisionMetadata.creationMetadata.date.getTime(),
        },
        updateMetadata: {
            curator: curatorEmail,
            date: Date.now(),
        },
    };
};

export const getCase = async (
    request: Request,
): Promise<CaseDocument | null> => {
    const caseReference = request.body.caseReference;

    if (request.method == 'PUT' && request.params?.id) {
        // Update.
        return Case.findById(request.params.id);
    } else if (
        request.method == 'PUT' &&
        caseReference &&
        caseReference.sourceId &&
        caseReference.sourceEntryId
    ) {
        // Upsert.
        // TODO: Upserts should only generate update metadata if there is a
        // diff with what's already in the database.
        return Case.findOne({
            'caseReference.sourceId': caseReference.sourceId,
            'caseReference.sourceEntryId': caseReference.sourceEntryId,
        });
    }

    return null;
};

export const setRevisionMetadata = async (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const curatorEmail = request.body.curator.email;

    // Single case update or upsert.
    const c = await getCase(request);

    // Set the correct, server-generated revisionMetadata for subsequent
    // processors to use.
    const revisionMetadata = c
        ? createUpdateMetadata(c, curatorEmail)
        : createNewMetadata(curatorEmail);
    request.body.revisionMetadata = revisionMetadata;

    // Clean up the additional metadata that falls outside the `case` entity.
    delete request.body.curator;

    next();
};

export const setBatchRevisionMetadata = async (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const curatorEmail = request.body.curator.email;

    // Find the cases if they already exists so we can update existing
    // metadata.
    const existingCases = await findCasesWithCaseReferenceData(
        request,
        /* fieldsToSelect= */ {
            _id: 1,
            caseReference: 1,
            revisionMetadata: 1,
        },
    );
    const metadataMap = new Map(
        existingCases
            .filter((c) => c && c.caseReference)
            .map((c) => [
                c.caseReference.sourceId + ':' + c.caseReference.sourceEntryId,
                createUpdateMetadata(c, curatorEmail),
            ]),
    );

    // Set the request cases' revision metadata to the update metadata, if
    // present, or create metadata otherwise.
    request.body.cases.forEach((c: any) => {
        c.revisionMetadata =
            metadataMap.get(
                c.caseReference?.sourceId +
                    ':' +
                    c.caseReference?.sourceEntryId,
            ) || createNewMetadata(curatorEmail);
    });

    // Clean up the additional metadata that falls outside the `case` entity.
    delete request.body.curator;

    next();
};

export const createCaseRevision = async (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const c = await getCase(request);

    if (c) {
        await new CaseRevision({
            case: c,
        }).save();
    }

    next();
};

export const createBatchCaseRevisions = async (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const casesToUpsert = (await findCasesWithCaseReferenceData(request)).map(
        (c) => {
            return {
                case: c,
            };
        },
    );

    await CaseRevision.insertMany(casesToUpsert, {
        ordered: false,
        rawResult: true,
        // @ts-ignore Mongoose types don't include the `lean` option from its
        // documentation: https://mongoosejs.com/docs/api.html#model_Model.insertMany
        lean: true
    });

    next();
};
