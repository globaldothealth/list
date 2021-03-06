import { Case, CaseDocument } from '../model/case';
import { EventDocument } from '../model/event';
import { Aggregate, DocumentQuery, Error, Query } from 'mongoose';
import { ObjectId, QuerySelector } from 'mongodb';
import { GeocodeOptions, Geocoder, Resolution } from '../geocoding/geocoder';
import { NextFunction, Request, Response } from 'express';
import parseSearchQuery, { ParsingError } from '../util/search';
import { SortByOrder, getSortByKeyword } from '../util/case';
import { parseDownloadedCase } from '../util/case';

import axios from 'axios';
import { logger } from '../util/logger';
import stringify from 'csv-stringify/lib/sync';
import _ from 'lodash';

class GeocodeNotFoundError extends Error {}

class InvalidParamError extends Error {}

type BatchValidationErrors = { index: number; message: string }[];

export class CasesController {
    constructor(private readonly geocoders: Geocoder[]) {}

    /**
     * Get a specific case.
     *
     * Handles HTTP GET /api/cases/:id.
     */
    get = async (req: Request, res: Response): Promise<void> => {
        // Check if this case's source is excluded
        const c = await Case.aggregate([
            {
                $match: {
                    _id: new ObjectId(req.params.id),
                },
            },
            {
                $addFields: {
                    sourceID: {
                        $toObjectId: '$caseReference.sourceId',
                    },
                },
            },
            {
                $lookup: {
                    localField: 'sourceID',
                    foreignField: '_id',
                    from: 'sources',
                    as: 'source',
                },
            },
            {
                $addFields: {
                    isSourceExcluded: {
                        $anyElementTrue: '$source.excludeFromLineList',
                    },
                },
            },
        ]);

        if (c.length === 0) {
            res.status(404).send({
                message: `Case with ID ${req.params.id} not found.`,
            });
            return;
        }
        res.json(c);
    };

    /**
     * Streams a CSV attachment of all cases.
     *
     * Handles HTTP POST /api/cases/download.
     */
    download = async (req: Request, res: Response): Promise<void> => {
        if (req.body.query && req.body.caseIds) {
            res.status(400).json({ message: 'Bad request' });
            return;
        }

        const queryLimit = Number(req.body.limit);

        // Goofy Mongoose types require this.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let casesQuery: any[];
        try {
            if (req.body.query) {
                casesQuery = this.caseAggregationFromQuery(
                    req.body.query as string,
                );
            } else if (req.body.caseIds) {
                casesQuery = [
                    {
                        $match: {
                            $expr: {
                                $in: [
                                    '$_id',
                                    _.map(
                                        req.body.caseIds,
                                        (anID: string) => new ObjectId(anID),
                                    ),
                                ],
                            },
                        },
                    },
                ];
            } else {
                casesQuery = [];
            }

            const casesIgnoringExcluded = this.excludeRestrictedSourcesFromCaseAggregation(
                casesQuery,
            );

            // Limit number of results if present
            // eslint-disable-next-line
            let limitedQuery: any[] = [];
            if (queryLimit) {
                limitedQuery = _.concat(casesIgnoringExcluded, [
                    { $limit: queryLimit },
                ]);
            }

            const matchingCases = await Case.aggregate(
                limitedQuery.length !== 0
                    ? limitedQuery
                    : casesIgnoringExcluded,
            ).collation({
                locale: 'en_US',
                strength: 2,
            });

            //Get current date
            const dateObj = new Date();

            // adjust 0 before single digit date
            const day = ('0' + dateObj.getDate()).slice(-2);
            const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
            const year = dateObj.getFullYear();

            const filename = `gh_${year}-${month}-${day}`;

            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Pragma', 'no-cache');

            logger.info('format: ' + req.body.format);

            switch (req.body.format) {
                case 'csv':
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader(
                        'Content-Disposition',
                        `attachment; filename="${filename}.csv"`,
                    );
                    axios
                        .get<string>(
                            'https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/functions/01-split/fields.txt',
                        )
                        .then((txtRes) => {
                            const columns = txtRes.data.split('\n');
                            const parsedCases = _.map(
                                matchingCases,
                                parseDownloadedCase,
                            );
                            const stringifiedCases = stringify(parsedCases, {
                                header: true,
                                columns: columns,
                            });
                            res.end(stringifiedCases);
                        });
                    break;

                case 'tsv':
                    res.setHeader('Content-Type', 'text/tsv');
                    res.setHeader(
                        'Content-Disposition',
                        `attachment; filename="${filename}.tsv"`,
                    );
                    axios
                        .get<string>(
                            'https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/functions/01-split/fields.txt',
                        )
                        .then((txtRes) => {
                            const columns = txtRes.data.split('\n');
                            const parsedCases = _.map(
                                matchingCases,
                                parseDownloadedCase,
                            );
                            const stringifiedCases = stringify(parsedCases, {
                                header: true,
                                columns: columns,
                                delimiter: '\t',
                            });
                            res.end(stringifiedCases);
                        });
                    break;

                case 'json':
                    const data = JSON.stringify(matchingCases);
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader(
                        'Content-Disposition',
                        `attachment; filename="${filename}.json"`,
                    );
                    res.end(data);
                    break;

                default:
                    break;
            }
        } catch (e) {
            if (e instanceof ParsingError) {
                logger.info('Error: ' + e);
                res.status(422).json({ message: e.message });
                return;
            }
            logger.error(e);
            res.status(500).json(e);
            return;
        }
    };

    /**
     * List all cases.
     *
     * Handles HTTP GET /api/cases.
     */
    list = async (req: Request, res: Response): Promise<void> => {
        logger.info('List method entrypoint');
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const countLimit = Number(req.query.count_limit) || 10000;
        const sortBy = Number(req.query.sort_by) || 0;
        const sortByOrder = Number(req.query.order) || 0;

        logger.info('Got query params');

        if (page < 1) {
            res.status(422).json({ message: 'page must be > 0' });
            return;
        }
        if (limit < 1) {
            res.status(422).json({ message: 'limit must be > 0' });
            return;
        }
        // Filter query param looks like &q=some%20search%20query
        if (
            typeof req.query.q !== 'string' &&
            typeof req.query.q !== 'undefined'
        ) {
            res.status(422).json({ message: 'q must be a unique string' });
            return;
        }

        logger.info('Got past 422s');
        try {
            const caseAggregation = this.caseAggregationFromQuery(
                req.query.q ?? '',
            );
            logger.info('Got case aggregation from query');

            const sortByKeyword = getSortByKeyword(sortBy);
            const sortedQuery = _.concat(caseAggregation, [
                {
                    $sort: {
                        [sortByKeyword]:
                            sortByOrder === SortByOrder.Ascending ? 1 : -1,
                    },
                },
            ]);
            logger.info('Sorted by keyword');

            const excludingRestrictedSources = this.excludeRestrictedSourcesFromCaseAggregation(
                sortedQuery,
            );
            logger.info('Excluded restricted sources');
            const addingCount = _.concat(excludingRestrictedSources, [
                {
                    $facet: {
                        metadata: [
                            {
                                $limit: countLimit,
                            },
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: 1 },
                                },
                            },
                        ],
                        docs: [
                            {
                                $skip: limit * (page - 1),
                            },
                            {
                                $limit: limit + 1,
                            },
                        ],
                    },
                },
                {
                    $project: {
                        docs: 1,
                        // Get total from the first element of the metadata array
                        total: { $arrayElemAt: ['$metadata.total', 0] },
                    },
                },
            ]);
            logger.info('Added count');
            // Do a fetch of documents and another fetch in parallel for total documents
            // count used in pagination.
            const results = await Case.aggregate(addingCount)
                .allowDiskUse(true)
                .collation({
                    locale: 'en_US',
                    strength: 2,
                });
            logger.info('Got results');
            const docs = results[0].docs;
            const total = results[0].total ?? 0;
            // If we have more items than limit, add a response param
            // indicating that there is more to fetch on the next page.
            if (docs.length == limit + 1) {
                docs.splice(limit);
                res.json({
                    cases: docs,
                    nextPage: page + 1,
                    total: total,
                });
                logger.info('Got multiple pages of results');
                return;
            }
            // If we fetched all available data, just return it.
            logger.info('Got one page of results');
            res.json({ cases: docs, total: total });
        } catch (e) {
            if (e instanceof ParsingError) {
                res.status(422).json({ message: e.message });
                return;
            }
            logger.error(e);
            res.status(500).json(e);
            return;
        }
    };

    /**
     * Create one or many identical cases.
     *
     * Handles HTTP POST /api/cases.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        const numCases = Number(req.query.num_cases) || 1;
        try {
            await this.geocode(req);
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
            if (err instanceof GeocodeNotFoundError) {
                res.status(404).json({
                    message: err.message,
                });
                return;
            }
            if (
                err.name === 'ValidationError' ||
                err instanceof InvalidParamError
            ) {
                res.status(422).json(err);
                return;
            }
            console.error(err);
            res.status(500).json(err);
            return;
        }
    };

    /**
     * Batch validates cases.
     */
    private batchValidate = async (
        // We're about to validate the cases, cannot type them yet.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cases: any[],
    ): Promise<BatchValidationErrors> => {
        const errors: { index: number; message: string }[] = [];
        // Do not parallelize these requests as it causes an out of memory error
        // for a large number of cases. However this does take a long time to run
        // sequentially, so if Mongo creates a batch validate method that should be used here.
        for (let index = 0; index < cases.length; index++) {
            const c = cases[index];
            await new Case(c).validate().catch((e) => {
                errors.push({ index: index, message: e.message });
            });
        }
        return errors;
    };

    /**
     * Perform geocoding for each case (of multiple `cases` specified in the
     * request body), in accordance with the above geocoding logic.
     *
     * TODO: https://github.com/globaldothealth/list/issues/1131 rate limit.
     */
    batchGeocode = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const geocodeErrors: { index: number; message: string }[] = [];
        try {
            // Do not parallelize these requests as it causes an out of memory error
            // for a large number of cases.
            for (let index = 0; index < req.body.cases.length; index++) {
                const c = req.body.cases[index];
                try {
                    await this.geocode({
                        body: c,
                    });
                } catch (err) {
                    if (err instanceof GeocodeNotFoundError) {
                        geocodeErrors.push({
                            index: index,
                            message: err.message,
                        });
                    } else if (err instanceof InvalidParamError) {
                        geocodeErrors.push({
                            index: index,
                            message: err.message,
                        });
                    }
                }
            }
            if (geocodeErrors.length > 0) {
                res.status(207).send({
                    phase: 'GEOCODE',
                    numCreated: 0,
                    numUpdated: 0,
                    errors: geocodeErrors,
                });
                return;
            }

            next();
        } catch (e) {
            res.send(e);
        }
    };

    /**
     * Batch upserts cases.
     *
     * Handles HTTP POST /api/cases/batchUpsert.
     *
     * Batch validate the cases then if no errors have happened performs the batch
     * upsert.
     */
    batchUpsert = async (req: Request, res: Response): Promise<void> => {
        try {
            // Batch validate cases first.
            logger.info('batchUpsert: entrypoint');
            const cases = req.body.cases;
            const errors = await this.batchValidate(cases);
            logger.info('batchUpsert: validated cases');
            if (errors.length > 0) {
                // drop any invalid cases but don't give up yet: upsert the remainder
                const badCases = _.orderBy(errors, 'index', 'desc').map(
                    (o) => o.index,
                );
                badCases.forEach((i) => {
                    cases.splice(i, 1);
                });
                logger.info(
                    `batchUpsert: dropped ${errors.length} invalid cases`,
                );
            }
            logger.info('batchUpsert: preparing bulk write');
            const bulkWriteResult = await Case.bulkWrite(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cases.map((c: any) => {
                    delete c.caseCount;
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
            logger.info('batchUpsert: finished bulk write');
            const status = errors.length > 0 ? 207 : 200;
            res.status(status).json({
                phase: 'UPSERT',
                numCreated:
                    (bulkWriteResult.insertedCount || 0) +
                    (bulkWriteResult.upsertedCount || 0),
                numUpdated: bulkWriteResult.modifiedCount,
                errors,
            });
            return;
        } catch (err) {
            if (err.name === 'ValidationError') {
                res.status(422).json(err);
                return;
            }
            logger.warn(err);
            res.status(500).json(err);
            return;
        }
    };

    /**
     * Update a specific case.
     *
     * Handles HTTP PUT /api/cases/:id.
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const c = await Case.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true,
            });
            if (!c) {
                res.status(404).send({
                    message: `Case with ID ${req.params.id} not found.`,
                });
                return;
            }
            res.json(c);
        } catch (err) {
            if (err.name === 'ValidationError') {
                res.status(422).json(err);
                return;
            }
            res.status(500).json(err);
            return;
        }
    };

    /**
     * Updates multiple cases.
     *
     * Handles HTTP POST /api/cases/batchUpdate.
     */
    batchUpdate = async (req: Request, res: Response): Promise<void> => {
        // Consider defining a type for the request-format cases.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!req.body.cases.every((c: any) => c._id)) {
            res.status(422).json({
                message: 'Every case must specify its _id',
            });
            return;
        }
        try {
            const bulkWriteResult = await Case.bulkWrite(
                // Consider defining a type for the request-format cases.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            res.status(500).json(err);
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
    upsert = async (req: Request, res: Response): Promise<void> => {
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
                // Geocode new cases.
                await this.geocode(req);
                const c = new Case(req.body);
                const result = await c.save();
                res.status(201).json(result);
                return;
            }
        } catch (err) {
            if (err instanceof GeocodeNotFoundError) {
                res.status(404).json({ message: err.message });
            }
            if (
                err.name === 'ValidationError' ||
                err instanceof InvalidParamError
            ) {
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
    batchDel = async (req: Request, res: Response): Promise<void> => {
        if (req.body.caseIds !== undefined) {
            Case.deleteMany(
                {
                    _id: {
                        $in: req.body.caseIds,
                    },
                },
                (err) => {
                    if (err) {
                        res.status(500).json(err);
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
        Case.deleteMany(casesQuery, (err: any) => {
            if (err) {
                res.status(500).json(err);
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
    del = async (req: Request, res: Response): Promise<void> => {
        const c = await Case.findByIdAndDelete(req.params.id, req.body);
        if (!c) {
            res.status(404).send({
                message: `Case with ID ${req.params.id} not found.`,
            });
            return;
        }
        res.status(204).end();
    };

    /**
     * Excludes multiple cases.
     *
     * Handles HTTP POST /api/batchStatusChange.
     * Receives an array of MongoDB IDs, status to be set for them and optional note.
     * Note is used only when excluding cases (status set to "Excluded").
     */
    batchStatusChange = async (req: Request, res: Response): Promise<void> => {
        const newStatus = req.body.status.toUpperCase();
        const caseIds = req.body.caseIds;

        if (newStatus === 'EXCLUDED' && !req.body.note) {
            res.status(422)
                .send({
                    message: 'Note is required when excluding cases.',
                })
                .end();
            return;
        }

        let updateQuery = {};

        try {
            if (!caseIds) {
                updateQuery = casesMatchingSearchQuery({
                    searchQuery: req.body.query,
                    count: false,
                });
            } else {
                updateQuery = {
                    _id: { $in: caseIds },
                };
                const validIdsCount = await Case.countDocuments(updateQuery);
                if (validIdsCount != caseIds.length) {
                    res.status(422)
                        .send({
                            message:
                                'At least one of provided case IDs was not found. No records changed.',
                        })
                        .end();
                    return;
                }
            }
        } catch (err) {
            if (err.name === 'CastError') {
                res.status(422)
                    .send({
                        message: `Provided ID (${err.value}) is not valid. More IDs may be invalid. No records changed.`,
                    })
                    .end();
                return;
            }
            logger.error(err);
            res.status(500).json(err).end();
            return;
        }

        try {
            let updateDocument = {};
            if (newStatus === 'EXCLUDED') {
                updateDocument = {
                    $set: {
                        'caseReference.verificationStatus': newStatus,
                        'exclusionData.date': Date.now(),
                        'exclusionData.note': req.body.note,
                    },
                };
            } else {
                updateDocument = {
                    $set: {
                        'caseReference.verificationStatus': newStatus,
                    },
                    $unset: {
                        exclusionData: '',
                    },
                };
            }
            await Case.updateMany(updateQuery, updateDocument);

            res.status(200).end();
        } catch (err) {
            logger.error(err);
            res.status(500).json(err).end();
        }
        return;
    };

    /**
     * Get a list of excluded cases IDs for a specific source ID.
     *
     * Handles HTTP GET /api/excludedCaseIds.
     */
    listExcludedCaseIds = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        /*
            We need to be able to include date filtering or
            not - requiring events to be an optional property.
         */
        const searchQuery: {
            'caseReference.verificationStatus': string;
            'caseReference.sourceId': string | undefined;
            events?: QuerySelector<EventDocument | [EventDocument]>;
        } = {
            'caseReference.verificationStatus': 'EXCLUDED',
            'caseReference.sourceId': req.query.sourceId?.toString(),
        };

        if (req.query.dateFrom || req.query.dateTo) {
            let dateRangeFilter = {};

            if (req.query.dateFrom) {
                dateRangeFilter = {
                    ...dateRangeFilter,
                    $gte: new Date(req.query.dateFrom.toString()),
                };
            }

            if (req.query.dateTo) {
                dateRangeFilter = {
                    ...dateRangeFilter,
                    $lte: new Date(req.query.dateTo.toString()),
                };
            }

            searchQuery['events'] = {
                $elemMatch: {
                    name: 'confirmed',
                    'dateRange.start': dateRangeFilter,
                },
            };
        }

        const cases = await Case.find(searchQuery).lean();

        const caseIds = cases
            .filter((c) => !!c.caseReference.sourceEntryId)
            .map((c) => c.caseReference.sourceEntryId);

        res.status(200).json({ cases: caseIds }).end();
    };

    /** Indicate that each case for the given source is pending deletion. */
    markPendingRemoval = async (req: Request, res: Response): Promise<void> => {
        try {
            req.body.cases.forEach((c: CaseDocument) => {
                c.pendingRemoval = true;
                c.save();
            });
            res.status(204).end();
        } catch (err) {
            res.status(500).json(err).end();
        }
    };

    /** Unset the pending deletion flag for cases from this source. */
    clearPendingRemovalStatus = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        try {
            req.body.cases.forEach((c: CaseDocument) => {
                c.pendingRemoval = false;
                c.save();
            });
            res.status(204).end();
        } catch (err) {
            res.status(500).json(err).end();
        }
    };

    private excludeRestrictedSourcesFromCaseAggregation(casesQuery: any[]) {
        return _.concat(casesQuery, [
            {
                $addFields: {
                    sourceID: {
                        $toObjectId: '$caseReference.sourceId',
                    },
                },
            },
            {
                $lookup: {
                    localField: 'sourceID',
                    foreignField: '_id',
                    from: 'sources',
                    as: 'source',
                },
            },
            {
                $addFields: {
                    isExcluded: {
                        $anyElementTrue: '$source.excludeFromLineList',
                    },
                },
            },
            {
                $match: {
                    isExcluded: false,
                },
            },
        ]);
    }

    private caseAggregationFromQuery(queryText: string) {
        let casesQuery: any[] = [];
        const parsedSearch = parseSearchQuery(queryText);

        const query = parsedSearch.fullTextSearch
            ? {
                  $text: { $search: parsedSearch.fullTextSearch },
              }
            : {};

        casesQuery = [{ $match: query }];
        const filters = parsedSearch.filters.map((f) => {
            if (f.values.length == 1) {
                const searchTerm = f.values[0];
                if (searchTerm === '*') {
                    return {
                        $match: {
                            [f.path]: {
                                $exists: true,
                            },
                        },
                    };
                } else {
                    if (
                        f.path === 'demographics.gender' &&
                        f.values[0] === 'noGender'
                    ) {
                        return {
                            $match: {
                                [f.path]: {
                                    $exists: false,
                                },
                            },
                        };
                    }
                    if (f.dateOperator) {
                        const dateRangeType =
                            f.dateOperator === '$gt'
                                ? 'dateRange.start'
                                : 'dateRange.end';
                        return {
                            $match: {
                                [f.path]: {
                                    $elemMatch: {
                                        name: 'confirmed',
                                        [dateRangeType]: {
                                            [f.dateOperator]: new Date(
                                                f.values[0].toString(),
                                            ),
                                        },
                                    },
                                },
                            },
                        };
                    } else {
                        return {
                            $match: {
                                [f.path]: f.values[0],
                            },
                        };
                    }
                }
            } else {
                return {
                    $match: {
                        $expr: {
                            $in: [`$${f.path}`, f.values],
                        },
                    },
                };
            }
        });
        casesQuery = _.concat(casesQuery, filters);
        return casesQuery;
    }

    /**
     * Geocodes a single location.
     * @param canBeFuzzy The location is allowed to be "fuzzy", in which case it may not get geocoded.
     * @returns The geocoded location.
     * @throws GeocodeNotFoundError if no geocode could be found.
     * @throws InvalidParamError if location.query is not specified and location
     *         is not complete already.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async geocodeLocation(
        location: any,
        canBeFuzzy: boolean,
    ): Promise<any> {
        // Geocode using location.query if no lat lng were provided.
        if (location?.geometry?.latitude && location.geometry?.longitude) {
            return location;
        }
        if (!location?.query) {
            if (canBeFuzzy) {
                // no problem, just give back what we received
                return location;
            }
            throw new InvalidParamError(
                'location.query must be specified to be able to geocode',
            );
        }

        const opts: GeocodeOptions = {};

        if (location['limitToResolution']) {
            opts.limitToResolution = [];
            location['limitToResolution']
                .split(',')
                .forEach((supplied: string) => {
                    const resolution =
                        Resolution[supplied as keyof typeof Resolution];
                    if (!resolution) {
                        throw new InvalidParamError(
                            `invalid limitToResolution: ${supplied}`,
                        );
                    }
                    opts.limitToResolution?.push(resolution);
                });
        }

        if (location['limitToCountry']) {
            opts.limitToCountry = location['limitToCountry']
                .split(',')
                .filter((countryCode: string) => countryCode.length === 2);
        }

        for (const geocoder of this.geocoders) {
            const features = await geocoder.geocode(location?.query, opts);
            if (features.length === 0) {
                continue;
            }
            // Currently a 1:1 match between the GeocodeResult and the data service API.
            // We also store the original query to match it later on and help debugging.
            return {
                query: location?.query,
                ...features[0],
            };
        }
        throw new GeocodeNotFoundError(
            `Geocode not found for ${location.query}`,
        );
    }

    /**
     * Geocodes request content if no lat lng were provided.
     * This geocodes both case location and case travel locations if specified.
     *
     * @throws GeocodeNotFoundError if no geocode could be found.
     * @throws InvalidParamError if location.query is not specified and location
     *         is not complete already.
     */
    // For batch requests, the case body is nested.
    // While we could define a type here, the right change is probably to use a
    // batch geocoding API for such cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async geocode(req: Request | any): Promise<void> {
        req.body['location'] = await this.geocodeLocation(
            req.body['location'],
            false,
        );
        for (const travel of req.body.travelHistory?.travel || []) {
            travel['location'] = await this.geocodeLocation(
                travel.location,
                true,
            );
        }
    }
}

/*
"location": {
    "country": "Costa Rica",
    "administrativeAreaLevel1": "Any province in Costa Rica",
    "administrativeAreaLevel2": "Any canton in Costa Rica",
    "administrativeAreaLevel3": "Any district in Costa Rica",
    "place": "Boston Children's Hospital",
    "name": "Lyon, Auvergne-Rhône-Alpes, France",
    "geoResolution": "Point",
    "geometry": {
      "latitude": 0,
      "longitude": 0
    },
    "query": "string",
    "limitToResolution": "string",
    "limitToCountry": string[]
  }
 */

// Returns a mongoose query for all cases matching the given search query.
// If count is true, it returns a query for the number of cases matching
// the search query.
export const casesMatchingSearchQuery = (opts: {
    searchQuery: string;
    count: boolean;
    limit?: number;
    // Goofy Mongoose types require this.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any => {
    // set data limit to 10K by default
    const countLimit = opts.limit ? opts.limit : 10000;
    const parsedSearch = parseSearchQuery(opts.searchQuery);
    const queryOpts = parsedSearch.fullTextSearch
        ? {
              $text: { $search: parsedSearch.fullTextSearch },
          }
        : {};

    let casesQuery: DocumentQuery<CaseDocument[], CaseDocument>;
    let countQuery: Query<number, CaseDocument>;

    if (opts.searchQuery === '') {
        // Always search with case-insensitivity.
        casesQuery = Case.find(queryOpts).collation({
            locale: 'en_US',
            strength: 2,
        });
        countQuery = Case.estimatedDocumentCount().collation({
            locale: 'en_US',
            strength: 2,
        });
    } else {
        // Always search with case-insensitivity.
        casesQuery = Case.find(queryOpts).collation({
            locale: 'en_US',
            strength: 2,
        });
        countQuery = Case.countDocuments(queryOpts)
            .limit(countLimit)
            .collation({
                locale: 'en_US',
                strength: 2,
            });
    }

    // Fill in keyword filters.
    parsedSearch.filters.forEach((f) => {
        if (f.values.length == 1) {
            const searchTerm = f.values[0];
            if (searchTerm === '*') {
                casesQuery.where(f.path).exists(true);
                countQuery.where(f.path).exists(true);
            } else {
                casesQuery.where(f.path).equals(f.values[0]);
                countQuery.where(f.path).equals(f.values[0]);
            }
        } else {
            casesQuery.where(f.path).in(f.values);
            countQuery.where(f.path).in(f.values);
        }
    });
    return opts.count ? countQuery : casesQuery.lean();
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
        // Case data should be validated prior to this point.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export const findCaseIdsWithCaseReferenceData = async (
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
        logger.error(e);
        res.status(500).json(e);
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
        logger.error(e);
        res.status(500).json(e);
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
        logger.error(e);
        res.status(500).json(e);
        return;
    }
};
