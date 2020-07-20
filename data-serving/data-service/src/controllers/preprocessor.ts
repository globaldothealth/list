import { Case, CaseDocument } from '../model/case';
import { NextFunction, Request, Response } from 'express';

import { RevisionMetadata } from '../model/revision-metadata';

const createNewMetadata = (curatorEmail: string, creationNotes: string) => {
    return {
        revisionNumber: 0,
        creationMetadata: {
            curator: curatorEmail,
            date: Date.now(),
            notes: creationNotes,
        },
    };
};

const createUpdateMetadata = (
    c: CaseDocument,
    curatorEmail: string,
    updateNotes: string,
) => {
    return {
        revisionNumber: ++c.revisionMetadata.revisionNumber,
        creationMetadata: c.revisionMetadata.creationMetadata,
        updateMetadata: {
            curator: curatorEmail,
            date: Date.now(),
            notes: updateNotes,
        },
    };
};

export const setRevisionMetadata = async (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const curatorEmail = request.body.curator.email;
    const caseReference = request.body?.caseReference;

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
        ? createUpdateMetadata(
              c,
              curatorEmail,
              request.body?.revisionMetadata?.updateMetadata?.notes,
          )
        : createNewMetadata(
              curatorEmail,
              request.body?.revisionMetadata?.creationMetadata?.notes,
          );
    request.body.revisionMetadata = revisionMetadata;

    // Clean up the additional metadata.
    delete request.body.curator;

    // NTS: Can you call `next` with the case and save ourselves from having to
    // do multiple reads?
    next();
};
