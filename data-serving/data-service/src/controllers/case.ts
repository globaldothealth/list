import { Case, CaseDocument } from '../model/case';
import { DocumentQuery, Query } from 'mongoose';
import { GeocodeOptions, Geocoder, Resolution } from '../geocoding/geocoder';
import { NextFunction, Request, Response } from 'express';
import parseSearchQuery, { ParsingError } from '../util/search';

import axios from 'axios';
import { logger } from '../util/logger';
import stringify from 'csv-stringify';
import yaml from 'js-yaml';

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
        const c = await Case.findById(req.params.id).lean();
        if (!c) {
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
        // Goofy Mongoose types require this.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let casesQuery: any;
        try {
            if (req.body.query) {
                casesQuery = casesMatchingSearchQuery({
                    searchQuery: req.body.query as string,
                    count: false,
                });
            } else if (req.body.caseIds) {
                casesQuery = Case.find({
                    _id: { $in: req.body.caseIds },
                }).lean();
            } else {
                casesQuery = Case.find({}).lean();
            }

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="cases.csv"',
            );
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Pragma', 'no-cache');
            axios
                .get<string>(
                    'https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/case_fields.yaml',
                )
                .then((yamlRes) => {
                    const dataDictionary = yaml.safeLoad(yamlRes.data);
                    const columns = (dataDictionary as Array<{
                        name: string;
                        description: string;
                    }>).map((datum) => datum.name);
                    casesQuery
                        .cursor()
                        .pipe(
                            stringify({
                                header: true,
                                columns: columns,
                            }),
                        )
                        .pipe(res);
                });
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
     * List all cases.
     *
     * Handles HTTP GET /api/cases.
     */
    list = async (req: Request, res: Response): Promise<void> => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
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
                    .limit(limit + 1),
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
            const errors = await this.batchValidate(req.body.cases);
            if (errors.length > 0) {
                res.status(207).send({
                    phase: 'VALIDATE',
                    numCreated: 0,
                    numUpdated: 0,
                    errors: errors,
                });
                return;
            }
            let bulkWriteResult;
            if (req.body.cases.length > 0) {
                // Use this method rather than Case.bulkWrite() as that method
                // causes an out of memory error for a large number of cases.
                const bulk = Case.collection.initializeUnorderedBulkOp();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                req.body.cases.map((c: any) => {
                    delete c.caseCount;
                    if (
                        c.caseReference?.sourceId &&
                        c.caseReference?.sourceEntryId
                    ) {
                        delete c._id;
                        bulk.find({
                            'caseReference.sourceId': c.caseReference.sourceId,
                            'caseReference.sourceEntryId':
                                c.caseReference.sourceEntryId,
                        })
                            .upsert()
                            .updateOne({ $set: c });
                    } else {
                        bulk.insert(c);
                    }
                });
                bulkWriteResult = await bulk.execute();
            }
            res.status(200).json({
                phase: 'UPSERT',
                numCreated:
                    (bulkWriteResult?.nInserted || 0) +
                    (bulkWriteResult?.nUpserted || 0),
                numUpdated: bulkWriteResult?.nModified || 0,
                errors: [],
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
        Case.deleteMany(casesQuery, (err) => {
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
     * Geocodes a single location.
     * @returns The geocoded location.
     * @throws GeocodeNotFoundError if no geocode could be found.
     * @throws InvalidParamError if location.query is not specified and location
     *         is not complete already.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async geocodeLocation(location: any): Promise<any> {
        // Geocode using location.query if no lat lng were provided.
        if (location?.geometry?.latitude && location.geometry?.longitude) {
            return location;
        }
        if (!location?.query) {
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
        req.body['location'] = await this.geocodeLocation(req.body['location']);
        for (const travel of req.body.travelHistory?.travel || []) {
            travel['location'] = await this.geocodeLocation(travel.location);
        }
    }
}

// Returns a mongoose query for all cases matching the given search query.
// If count is true, it returns a query for the number of cases matching
// the search query.
export const casesMatchingSearchQuery = (opts: {
    searchQuery: string;
    count: boolean;
    // Goofy Mongoose types require this.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any => {
    const parsedSearch = parseSearchQuery(opts.searchQuery);
    const queryOpts = parsedSearch.fullTextSearch
        ? {
              $text: { $search: parsedSearch.fullTextSearch },
          }
        : {};

    // Always search with case-insensitivity.
    const casesQuery = Case.find(queryOpts).collation({
        locale: 'en_US',
        strength: 2,
    });
    const countQuery = Case.countDocuments(queryOpts).collation({
        locale: 'en_US',
        strength: 2,
    });
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
