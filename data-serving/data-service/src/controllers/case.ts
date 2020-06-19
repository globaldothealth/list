import { Request, Response } from 'express';

import { Case } from '../model/case';

/**
 * Get a specific case.
 *
 * Handles HTTP GET /api/cases/:id.
 */
export const get = async (req: Request, res: Response): Promise<void> => {
    const c = await Case.findById(req.params.id);
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
    // Filter query param looks like &filter=notes:work,other_field:foo
    const filterQuery = String(req.query.filter || '').trim();
    // Query to mongo looks like { "notes": {$regex: /work/} }
    // Note: We should use $text instead of $regex but until we have indexes
    // that's not possible.
    const query: { [k: string]: { [k: string]: RegExp } } = {};
    if (filterQuery.length > 0) {
        const filters = filterQuery.split(',');
        for (const filter of filters) {
            const [field, value] = filter.split(':');
            query[field] = { $regex: new RegExp(value, 'i') };
        }
    }
    console.info('Querying cases with query:', query);
    // Do a fetch of documents and another fetch in parallel for total documents
    // count used in pagination.
    try {
        const [docs, total] = await Promise.all([
            Case.find(query)
                .skip(limit * (page - 1))
                .limit(limit + 1),
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
        // TODO: Don't consume req.body directly; add layer between API and
        // storage.
        const c = new Case(req.body);
        const result = await c.save();
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
 * Upserts a case based on a compound index of { sourceId, entryId }.
 */
export const upsert = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await Case.findOneAndUpdate(
            {
                'caseReference.dataSourceId':
                    req.body.caseReference?.dataSourceId,
                'caseReference.dataEntryId':
                    req.body.caseReference?.dataEntryId,
            },
            req.body,
            {
                new: true,
                rawResult: true,
                runValidators: true,
                upsert: true,
            },
        );
        console.log(result);
        let status;
        if (result.lastErrorObject.updatedExisting) {
            status = 200;
        } else {
            status = 201;
        }
        res.status(status).json(result.value);
    } catch (err) {
        console.log(err);
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
