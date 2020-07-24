import { Case, CaseDocument } from '../model/case';
import { NextFunction, Request, Response } from 'express';

import { RevisionMetadata } from '../model/revision-metadata';

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

export const setRevisionMetadata = async (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const curatorEmail = request.body.curator.email;
    const caseReference = request.body.caseReference;

    // Find the case if it already exists so we can update its existing
    // metadata.
    let c;
    if (request.method == 'PUT' && request.params?.id) {
        // Update.
        c = await Case.findById(request.params.id);
    } else if (
        request.method == 'PUT' &&
        caseReference &&
        caseReference.sourceId &&
        caseReference.sourceEntryId
    ) {
        // Upsert.
        // TODO: Upserts should only generate update metadata if there is a
        // diff with what's already in the database.
        c = await Case.findOne({
            'caseReference.sourceId': caseReference.sourceId,
            'caseReference.sourceEntryId': caseReference.sourceEntryId,
        });
    }

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
