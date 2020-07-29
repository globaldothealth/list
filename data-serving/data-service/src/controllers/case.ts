import { Request, Response } from 'express';

import { Case } from '../model/case';

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
    const searchQuery = String(req.query.q || '').trim();
    const query = searchQuery
        ? {
              $text: { $search: searchQuery },
          }
        : {};

    // Do a fetch of documents and another fetch in parallel for total documents
    // count used in pagination.
    try {
        const [docs, total] = await Promise.all([
            Case.find(query)
                .sort({ 'revisionMetadata.creationMetadata.date': -1 })
                .skip(limit * (page - 1))
                .limit(limit + 1)
                // We don't need mongoose docs here, just plain json.
                .lean(),
            Case.countDocuments(query),
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
 * Create a case.
 *
 * Handles HTTP POST /api/cases.
 */
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const c = new Case(req.body);

        let result;
        if (req.query.validate_only) {
            await c.validate();
            result = c;
        } else {
            result = await c.save();
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
 * Batch upserts cases.
 *
 * Handles HTTP POST /api/cases/batchUpsert.
 *
 * Note that this method is _not_ atomic, and that validation _should be
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
        const providedCaseReferenceData = req.body.cases
            .filter(
                (c: any) =>
                    c.caseReference?.sourceId && c.caseReference?.sourceEntryId,
            )
            .map((c: any) => {
                return {
                    'caseReference.sourceId': c.caseReference.sourceId,
                    'caseReference.sourceEntryId':
                        c.caseReference.sourceEntryId,
                };
            });
        const toBeUpsertedCaseIds =
            providedCaseReferenceData.length > 0
                ? await Case.find()
                      .select('_id')
                      .or(providedCaseReferenceData)
                      .lean()
                      .exec()
                : [];
        const bulkWriteResult = await Case.bulkWrite(
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
                            update: { $set: { c } },
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
        );
        res.status(207).json({
            createdCaseIds: Object.entries(bulkWriteResult.insertedIds)
                .concat(Object.entries(bulkWriteResult.upsertedIds))
                .map((kv) => String(kv[1])),
            updatedCaseIds: toBeUpsertedCaseIds.map((res) =>
                String(res['_id']),
            ),
        });
        return;
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
    const limit = Number(req.query.limit) || 5;
    if (limit < 1) {
        res.status(422).json('limit must be > 0');
        return;
    }
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
