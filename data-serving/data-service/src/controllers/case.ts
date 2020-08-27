import { Case, CaseDocument } from '../model/case';
import { DocumentQuery, Query } from 'mongoose';
import { Request, Response } from 'express';

import parseSearchQuery from '../util/search';

/**
 * Get a specific case.
 *
 * Handles HTTP GET /api/cases/:id.
 */
export const get = async (req: Request, res: Response): Promise<void> => {
    const c = await Case.findById(req.params.id).lean();
    if (!c) {
        res.status(404).send(`Case with ID ${req.params.id} not found.`);
        return;
    }
    res.json(c);
};

// Returns a mongoose query for all cases matching the given search query.
// If count is true, it returns a query for the number of cases matching
// the search query.
const casesMatchingSearchQuery = (opts: {
    searchQuery: string;
    count: boolean;
}) => {
    const parsedSearch = parseSearchQuery(opts.searchQuery);
    const queryOpts = parsedSearch.fullTextSearch
        ? {
              $text: { $search: parsedSearch.fullTextSearch },
          }
        : {};

    const casesQuery = Case.find(queryOpts);
    const countQuery = Case.countDocuments(queryOpts);
    // Fill in keyword filters.
    parsedSearch.filters.forEach((f) => {
        if (f.values.length == 1) {
            casesQuery.where(f.path).equals(f.values[0]);
            countQuery.where(f.path).equals(f.values[0]);
        } else {
            casesQuery.where(f.path).in(f.values);
            countQuery.where(f.path).in(f.values);
        }
    });
    return opts.count ? countQuery : casesQuery;
};

/**
 * List all cases.
 *
 * Handles HTTP GET /api/cases.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    if (page < 1) {
        res.status(422).json('page must be > 0');
        return;
    }
    if (limit < 1) {
        res.status(422).json('limit must be > 0');
        return;
    }
    // Filter query param looks like &q=some%20search%20query
    if (typeof req.query.q !== 'string' && typeof req.query.q !== 'undefined') {
        res.status(422).json('q must be a unique string');
        return;
    }
    try {
        const casesQuery = casesMatchingSearchQuery({
            searchQuery: req.query.q || '',
            count: false,
        }) as DocumentQuery<CaseDocument[], CaseDocument, unknown>;
        const countQuery = casesMatchingSearchQuery({
            searchQuery: req.query.q || '',
            count: true,
        }) as Query<number>;
        // Do a fetch of documents and another fetch in parallel for total documents
        // count used in pagination.
        const [docs, total] = await Promise.all([
            casesQuery
                .sort({ 'revisionMetadata.creationMetadata.date': -1 })
                .skip(limit * (page - 1))
                .limit(limit + 1)
                // We don't need mongoose docs here, just plain json.
                .lean(),
            countQuery,
        ]);
        // If we have more items than limit, add a response param
        // indicating that there is more to fetch on the next page.
        if (docs.length == limit + 1) {
            docs.splice(limit);
            res.json({
                cases: docs,
                nextPage: page + 1,
                total: total,
            });
            return;
        }
        // If we fetched all available data, just return it.
        res.json({ cases: docs, total: total });
    } catch (e) {
        console.error(e);
        res.status(500).json(e.message);
        return;
    }
};

/**
 * Create one or many identical cases.
 *
 * Handles HTTP POST /api/cases.
 */
export const create = async (req: Request, res: Response): Promise<void> => {
    const numCases = Number(req.query.num_cases) || 1;
    try {
        const c = new Case(req.body);

        let result;
        if (req.query.validate_only) {
            await c.validate();
            result = c;
        } else {
            if (numCases === 1) {
                result = await c.save();
            } else {
                const cases = Array.from(
                    { length: numCases },
                    () => new Case(req.body),
                );
                result = { cases: await Case.insertMany(cases) };
            }
        }
        res.status(201).json(result);
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(422).json(err.message);
            return;
        }
        res.status(500).json(err.message);
        return;
    }
};

/**
 * Batch validates cases.
 *
 * Handles HTTP POST /api/cases/batchValidate.
 */
export const batchValidate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const errors: { index: number; message: string }[] = [];
        await Promise.all(
            // We're about to validate this data; any is fine, here.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            req.body.cases.map((c: any, index: number) => {
                return new Case(c).validate().catch((e) => {
                    errors.push({ index: index, message: e.message });
                });
            }),
        );
        res.status(207).json({ errors: errors });
        return;
    } catch (err) {
        res.status(500).json(err.message);
        return;
    }
};

/**
 * Find IDs of existing cases that have {caseReference.sourceId,
 * caseReference.sourceEntryId} combinations matching any cases in the provided
 * request.
 *
 * This is used in batchUpsert. Background:
 *
 *   While MongoDB does return IDs of created documents, it doesn't do so
 *   for modified documents (e.g. cases updated via upsert calls). In
 *   order to (necessarily) provide that information, we'll query existing
 *   cases, filtering on provided case reference data, in order to provide
 *   an accurate list of updated case IDs.
 */
export const findCasesWithCaseReferenceData = async (
    req: Request,
    fieldsToSelect = {},
): Promise<CaseDocument[]> => {
    const providedCaseReferenceData = req.body.cases
        .filter(
            // Case data should be validated prior to this point.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) =>
                c.caseReference?.sourceId && c.caseReference?.sourceEntryId,
        )
        .map((c: any) => {
            return {
                'caseReference.sourceId': c.caseReference.sourceId,
                'caseReference.sourceEntryId': c.caseReference.sourceEntryId,
            };
        });

    return providedCaseReferenceData.length > 0
        ? Case.find()
              .or(providedCaseReferenceData)
              .select(fieldsToSelect)
              .exec()
        : [];
};

/**
 * Find IDs of existing cases that have {caseReference.sourceId,
 * caseReference.sourceEntryId} combinations matching any cases in the provided
 * request.
 *
 * This is used in batchUpsert. Background:
 *
 *   While MongoDB does return IDs of created documents, it doesn't do so
 *   for modified documents (e.g. cases updated via upsert calls). In
 *   order to (necessarily) provide that information, we'll query existing
 *   cases, filtering on provided case reference data, in order to provide
 *   an accurate list of updated case IDs.
 */
const findCaseIdsWithCaseReferenceData = async (
    req: Request,
): Promise<string[]> => {
    return (
        await findCasesWithCaseReferenceData(
            req,
            /* fieldsToSelect= */ { _id: 1 },
        )
    ).map((c) => String(c._id));
};

/**
 * Batch upserts cases.
 *
 * Handles HTTP POST /api/cases/batchUpsert.
 *
 * Note that this method is _not_ atomic, and that validation _should_ be
 * performed prior to invocation. Upserted cases are not validated, and while
 * any validation issues for created cases will cause the API to return 422,
 * all provided cases without validation errors will be written.
 *
 * TODO: Wrap batchValidate in this method.
 */
export const batchUpsert = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const toBeUpsertedCaseIds = await findCaseIdsWithCaseReferenceData(req);
        const bulkWriteResult = await Case.bulkWrite(
            // Case data should be validated prior to this point.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            req.body.cases.map((c: any) => {
                if (
                    c.caseReference?.sourceId &&
                    c.caseReference?.sourceEntryId
                ) {
                    return {
                        updateOne: {
                            filter: {
                                'caseReference.sourceId':
                                    c.caseReference.sourceId,
                                'caseReference.sourceEntryId':
                                    c.caseReference.sourceEntryId,
                            },
                            update: c,
                            upsert: true,
                        },
                    };
                } else {
                    return {
                        insertOne: {
                            document: c,
                        },
                    };
                }
            }),
            { ordered: false },
        );
        res.status(207).json({
            // Types are a little goofy here. We're grabbing the string ID from
            // what MongoDB returns, which is data in the form of:
            //   { index0 (string): _id0 (ObjectId), ..., indexN: _idN}
            createdCaseIds: Object.entries(bulkWriteResult.insertedIds)
                .concat(Object.entries(bulkWriteResult.upsertedIds))
                .map((kv) => String(kv[1])),
            updatedCaseIds: toBeUpsertedCaseIds,
        });
        return;
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(422).json(err.message);
            return;
        }
        console.warn(err);
        res.status(500).json(err.message);
        return;
    }
};

/**
 * Update a specific case.
 *
 * Handles HTTP PUT /api/cases/:id.
 */
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const c = await Case.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!c) {
            res.status(404).send(`Case with ID ${req.params.id} not found.`);
            return;
        }
        res.json(c);
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(422).json(err.message);
            return;
        }
        res.status(500).json(err.message);
        return;
    }
};

/**
 * Updates multiple cases.
 *
 * Handles HTTP PUT /api/cases/batchUpdate.
 */
export const batchUpdate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    if (!req.body.cases.every((c: any) => c._id)) {
        res.status(422).json('Every case must specify its _id');
        return;
    }
    try {
        const bulkWriteResult = await Case.bulkWrite(
            req.body.cases.map((c: any) => {
                return {
                    updateOne: {
                        filter: {
                            _id: c._id,
                        },
                        update: c,
                    },
                };
            }),
            { ordered: false },
        );
        res.json({ numModified: bulkWriteResult.modifiedCount });
    } catch (err) {
        res.status(500).json(err.message);
        return;
    }
};

/**
 * Upserts a case based on a compound index of
 * caseReference.{dataSourceId, dataEntryId}.
 *
 * On success, the returned status code indicates whether than item was created
 * (201) or updated (200).
 *
 * Handles HTTP PUT /api/cases.
 */
export const upsert = async (req: Request, res: Response): Promise<void> => {
    try {
        const c = await Case.findOne({
            'caseReference.sourceId': req.body.caseReference?.sourceId,
            'caseReference.sourceEntryId':
                req.body.caseReference?.sourceEntryId,
        });
        if (
            req.body.caseReference?.sourceId &&
            req.body.caseReference?.sourceEntryId &&
            c
        ) {
            c.set(req.body);
            const result = await c.save();
            res.status(200).json(result);
            return;
        } else {
            const c = new Case(req.body);
            const result = await c.save();
            res.status(201).json(result);
            return;
        }
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(422).json(err.message);
            return;
        }
        res.status(500).json(err.message);
        return;
    }
};

/**
 * Deletes multiple cases.
 *
 * Handles HTTP DELETE /api/cases.
 */
export const batchDel = async (req: Request, res: Response): Promise<void> => {
    if (req.body.caseIds !== undefined) {
        Case.deleteMany(
            {
                _id: {
                    $in: req.body.caseIds,
                },
            },
            (err) => {
                if (err) {
                    res.status(500).json(err.message);
                    return;
                }
                res.status(204).end();
            },
        );
        return;
    }

    const casesQuery = casesMatchingSearchQuery({
        searchQuery: req.body.query,
        count: false,
    });
    Case.deleteMany(casesQuery, (err) => {
        if (err) {
            res.status(500).json(err.message);
            return;
        }
        res.status(204).end();
    });
};

/**
 * Delete a specific case.
 *
 * Handles HTTP DELETE /api/cases/:id.
 */
export const del = async (req: Request, res: Response): Promise<void> => {
    const c = await Case.findByIdAndDelete(req.params.id, req.body);
    if (!c) {
        res.status(404).send(`Case with ID ${req.params.id} not found.`);
        return;
    }
    res.status(204).end();
};

/**
 * List most frequently used symptoms.
 *
 * Handles HTTP GET /api/cases/symptoms.
 */
export const listSymptoms = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const limit = Number(req.query.limit);
    try {
        const symptoms = await Case.aggregate([
            { $unwind: '$symptoms.values' },
            { $sortByCount: '$symptoms.values' },
            { $sort: { count: -1, _id: 1 } },
        ]).limit(limit);
        res.json({
            symptoms: symptoms.map((symptomObject) => symptomObject._id),
        });
        return;
    } catch (e) {
        console.error(e);
        res.status(500).json(e.message);
        return;
    }
};

/**
 * List most frequently used places of transmission.
 *
 * Handles HTTP GET /api/cases/placesOfTransmission.
 */
export const listPlacesOfTransmission = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const limit = Number(req.query.limit);
    try {
        const placesOfTransmission = await Case.aggregate([
            { $unwind: '$transmission.places' },
            { $sortByCount: '$transmission.places' },
            { $sort: { count: -1, _id: 1 } },
        ]).limit(limit);
        res.json({
            placesOfTransmission: placesOfTransmission.map(
                (placeOfTransmissionObject) => placeOfTransmissionObject._id,
            ),
        });
        return;
    } catch (e) {
        console.error(e);
        res.status(500).json(e.message);
        return;
    }
};

/**
 * List most frequently used occupations.
 *
 * Handles HTTP GET /api/cases/occupations.
 */
export const listOccupations = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const limit = Number(req.query.limit);
    try {
        const occupations = await Case.aggregate([
            { $sortByCount: '$demographics.occupation' },
            { $sort: { count: -1, _id: 1 } },
        ]).limit(limit);
        res.json({
            occupations: occupations.map(
                (occupationObject) => occupationObject._id,
            ),
        });
        return;
    } catch (e) {
        console.error(e);
        res.status(500).json(e.message);
        return;
    }
};
