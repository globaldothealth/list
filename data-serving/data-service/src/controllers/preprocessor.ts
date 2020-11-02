import { Case, CaseDocument } from '../model/case';
import { NextFunction, Request, Response } from 'express';
import {
    casesMatchingSearchQuery,
    findCasesWithCaseReferenceData,
} from './case';

import { CaseRevision } from '../model/case-revision';
import { DocumentQuery } from 'mongoose';
import _ from 'lodash';

// TODO: Type this as RevisionMetadataDocument.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createNewMetadata = (curatorEmail: string): any => {
    return {
        revisionNumber: 0,
        creationMetadata: {
            curator: curatorEmail,
            date: Date.now(),
        },
    };
};

// TODO: Type this as RevisionMetadataDocument.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createUpdateMetadata = (c: CaseDocument, curatorEmail: string): any => {
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
    const caseReference = request.body?.caseReference;

    if (
        (request.method == 'PUT' || request.method == 'DELETE') &&
        request.params?.id
    ) {
        // Update or delete.
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
): Promise<void> => {
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

// Remove cases from the request that don't need to be updated.
export const batchUpsertDropUnchangedCases = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const existingCasesByCaseRefCombo = new Map(
        (await findCasesWithCaseReferenceData(request))
            .filter((c) => c && c.caseReference)
            .map((c) => [
                c.caseReference.sourceId + ':' + c.caseReference.sourceEntryId,
                c,
            ]),
    );

    for (let i = 0; i < request.body.cases.length; i++) {
        const c = request.body.cases[i];
        if (c.caseReference?.sourceId && c.caseReference?.sourceEntryId) {
            const existingCase = existingCasesByCaseRefCombo.get(
                c.caseReference.sourceId + ':' + c.caseReference.sourceEntryId,
            );
            if (existingCase !== undefined && existingCase.equalsJSON(c)) {
                request.body.cases.splice(i, 1);
                i--;
            }
        }
    }

    next();
};

// Set appropriate values for the revision metadata and uploadids fields.
export const setBatchUpsertFields = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const curatorEmail = request.body.curator.email;

    // Find and map existing cases by sourceId:sourceEntryId.
    const existingCasesByCaseRefCombo = new Map(
        (await findCasesWithCaseReferenceData(request))
            .filter((c) => c && c.caseReference)
            .map((c) => [
                c.caseReference.sourceId + ':' + c.caseReference.sourceEntryId,
                c,
            ]),
    );

    // For existing cases, compute the revision metadata that should be saved
    // to the database.
    const metadataMap = new Map();
    existingCasesByCaseRefCombo.forEach((c, caseRefKey) => {
        metadataMap.set(caseRefKey, createUpdateMetadata(c, curatorEmail));
    });

    // TODO: Type request Cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.body.cases.forEach((c: any) => {
        // Set the request cases' revision metadata to the update metadata, if
        // present, or create metadata otherwise.
        c.revisionMetadata =
            metadataMap.get(
                c.caseReference?.sourceId +
                    ':' +
                    c.caseReference?.sourceEntryId,
            ) || createNewMetadata(curatorEmail);

        // If case is present, add uploadIds to existing list of uploadIds
        if (
            c.caseReference?.uploadIds &&
            c.caseReference?.sourceId &&
            c.caseReference?.sourceEntryId
        ) {
            const existingCaseUploadIds = existingCasesByCaseRefCombo.get(
                c.caseReference.sourceId + ':' + c.caseReference.sourceEntryId,
            )?.caseReference?.uploadIds;
            if (existingCaseUploadIds) {
                c.caseReference.uploadIds = _.union(
                    c.caseReference.uploadIds,
                    existingCaseUploadIds,
                );
            }
        }
    });
    // Clean up the additional metadata that falls outside the `case` entity.
    delete request.body.curator;

    next();
};

export const findCasesToUpdate = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    // Find all cases matching the query
    const matchedCases = await (casesMatchingSearchQuery({
        searchQuery: request.body.query,
        count: false,
    }) as DocumentQuery<CaseDocument[], CaseDocument, unknown>).exec();

    // Set those case ids to be updated with the request case.
    // TODO: Type request Cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const casesToUpdate = matchedCases.map((c: any) => {
        return { _id: c._id, ...request.body.case };
    });
    request.body.cases = casesToUpdate;

    // Delete no longer used fields
    delete request.body.query;
    delete request.body.case;

    next();
};

export const setBatchUpdateRevisionMetadata = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const curatorEmail = request.body.curator.email;

    const existingCases = await Case.find({
        _id: {
            // TODO: Type request Cases.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            $in: request.body.cases.map((c: any) => c._id),
        },
    })
        .select({
            _id: 1,
            revisionMetadata: 1,
        })
        .exec();

    const metadataMap = new Map(
        existingCases.map((c) => [
            c._id.toString(),
            createUpdateMetadata(c, curatorEmail),
        ]),
    );

    // Set the request cases' revision metadata to the update metadata.
    // TODO: Type request Cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.body.cases.forEach((c: any) => {
        c.revisionMetadata = metadataMap.get(c._id?.toString());
    });

    // Clean up the additional metadata that falls outside the `case` entity.
    delete request.body.curator;

    next();
};

export const createCaseRevision = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const c = await getCase(request);

    if (c) {
        await new CaseRevision({
            case: c,
        }).save();
    }

    next();
};

export const batchDeleteCheckThreshold = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    if (request.body.query) {
        const maxCasesThreshold = request.body['maxCasesThreshold'];
        if (maxCasesThreshold) {
            const total = await casesMatchingSearchQuery({
                searchQuery: request.body.query,
                count: true,
            });
            if (total > Number(maxCasesThreshold)) {
                response.status(422).json({
                    message: `query ${request.body.query} will delete ${total} cases which is more than the maximum allowed of ${maxCasesThreshold}, only admins are not subject to the maximum number of cases restriction. Please contact one if you wish to move forward with the deletion.`,
                });
                return;
            }
        }
    }

    next();
};

export const createBatchDeleteCaseRevisions = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    let casesToDelete: { case: CaseDocument }[];
    if (request.body.caseIds !== undefined) {
        casesToDelete = (
            await Case.find({
                _id: {
                    $in: request.body.caseIds,
                },
            }).exec()
        ).map((c) => {
            return {
                case: c,
            };
        });
    } else {
        const casesQuery = casesMatchingSearchQuery({
            searchQuery: request.body.query,
            count: false,
        });
        casesToDelete = (await Case.find(casesQuery).exec()).map((c) => {
            return {
                case: c,
            };
        });
    }

    await CaseRevision.insertMany(casesToDelete, {
        ordered: false,
        rawResult: true,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Mongoose types don't include the `lean` option from its
        // documentation: https://mongoosejs.com/docs/api.html#model_Model.insertMany
        lean: true,
    });

    next();
};

export const createBatchUpsertCaseRevisions = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Mongoose types don't include the `lean` option from its
        // documentation: https://mongoosejs.com/docs/api.html#model_Model.insertMany
        lean: true,
    });

    next();
};

export const createBatchUpdateCaseRevisions = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const casesToUpdate = (
        await Case.find({
            _id: {
                // TODO: Type request Cases.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                $in: request.body.cases.map((c: any) => c._id),
            },
        }).exec()
    ).map((c) => {
        return {
            case: c,
        };
    });

    await CaseRevision.insertMany(casesToUpdate, {
        ordered: false,
        rawResult: true,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Mongoose types don't include the `lean` option from its
        // documentation: https://mongoosejs.com/docs/api.html#model_Model.insertMany
        lean: true,
    });

    next();
};
