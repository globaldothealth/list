import { Request, Response } from 'express';

import { Case } from '../model/case';
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
    const parsedSearch = parseSearchQuery(req.query.q || '');
    const query = parsedSearch.fullTextSearch
        ? {
              $text: { $search: parsedSearch.fullTextSearch },
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
