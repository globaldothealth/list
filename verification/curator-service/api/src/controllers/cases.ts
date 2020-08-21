import { GeocodeOptions, Geocoder, Resolution } from '../geocoding/geocoder';
import { Request, Response } from 'express';

import { UserDocument } from '../model/user';
import axios from 'axios';

class InvalidParamError extends Error {}

/**
 * CasesController forwards requests to the data service.
 * It handles CRUD operations from curators.
 */
export default class CasesController {
    constructor(
        private readonly dataServerURL: string,
        private readonly geocoders: Geocoder[],
    ) {}

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    listSymptoms = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    listPlacesOfTransmission = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    listOccupations = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    get = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    del = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.delete(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).end();
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.put(
                this.dataServerURL + '/api' + req.url,
                {
                    ...req.body,
                    curator: { email: (req.user as UserDocument).email },
                },
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    upsert = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!(await this.geocode(req))) {
                res.status(404).send(
                    `no geolocation found for ${req.body['location']?.query}`,
                );
                return;
            }
            const response = await axios.put(
                this.dataServerURL + '/api' + req.url,
                {
                    ...req.body,
                    curator: { email: (req.user as UserDocument).email },
                },
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            if (err instanceof InvalidParamError) {
                res.status(422).send(err.message);
                return;
            }
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err.message);
        }
    };

    /**
     * Validates and upserts the provided cases.
     *
     * Executes three operations on the supplied data:
     *
     *   1. Geocodes provided cases as required. If there are any issues
     *      geocoding (which is done serially -- though we should consider
     *      taking advantage of a batch geocode API), return the results now
     *      without proceeding to the validation stage.
     *   2. Performs validation of all provided cases via the data service
     *      batchValidate API. If any validation issues are found, return the
     *      results now without proceeding to the upsert stage.
     *   3. Upserts the data via the data service upsert API.
     */
    batchUpsert = async (req: Request, res: Response): Promise<void> => {
        try {
            // 1. Geocode each case.
            const geocodeErrors = await this.batchGeocode(req);
            if (geocodeErrors.length > 0) {
                res.status(207).send({
                    phase: 'GEOCODE',
                    createdCaseIds: [],
                    updatedCaseIds: [],
                    errors: geocodeErrors,
                });
                return;
            }

            // 2. Batch validate.
            const validationResponse = await axios.post(
                this.dataServerURL + '/api/cases/batchValidate',
                req.body,
                { maxContentLength: Infinity },
            );
            if (validationResponse.data.errors.length > 0) {
                res.status(207).send({
                    phase: 'VALIDATE',
                    createdCaseIds: [],
                    updatedCaseIds: [],
                    errors: validationResponse.data.errors,
                });
                return;
            }

            // 3. Batch upsert.
            const upsertResponse = await axios.post(
                this.dataServerURL + '/api/cases/batchUpsert',
                {
                    ...req.body,
                    curator: { email: (req.user as UserDocument).email },
                },
                { maxContentLength: Infinity },
            );
            res.status(200).send({
                phase: 'UPSERT',
                createdCaseIds: upsertResponse.data.createdCaseIds,
                updatedCaseIds: upsertResponse.data.updatedCaseIds,
                errors: [],
            });
            return;
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err.message);
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!(await this.geocode(req))) {
                res.status(404).send(
                    `no geolocation found for ${req.body['location']?.query}`,
                );
                return;
            }
            const response = await axios.post(
                this.dataServerURL + '/api' + req.url,
                {
                    ...req.body,
                    curator: { email: (req.user as UserDocument).email },
                },
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            if (err instanceof InvalidParamError) {
                res.status(422).send(err.message);
                return;
            }
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err.message);
        }
    };

    /**
     * Geocodes request content if no lat lng were provided.
     *
     * @returns {boolean} Whether lat lng were either provided or geocoded
     */
    // For batch requests, the case body is nested.
    // While we could define a type here, the right change is probably to use a
    // batch geocoding API for such cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async geocode(req: Request | any): Promise<boolean> {
        // Geocode query if no lat lng were provided.
        const location = req.body['location'];
        if (location?.geometry?.latitude && location.geometry?.longitude) {
            return true;
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
            req.body['location'] = features[0];
            return true;
        }
        return false;
    }

    /**
     * Perform geocoding for each case (of multiple `cases` specified in the
     * request body), in accordance with the above geocoding logic.
     *
     * TODO: Use a batch geocode API.
     *
     * @returns {object} Detailing the nature of any issues encountered.
     */
    private async batchGeocode(
        req: Request,
    ): Promise<{ index: number; message: string }[]> {
        const caseCount = req.body.cases.length;
        const geocodeErrors: { index: number; message: string }[] = [];
        for (let index = 0; index < caseCount; index++) {
            const c = req.body.cases[index];
            try {
                const geocodeResult = await this.geocode({
                    body: c,
                });
                if (!geocodeResult) {
                    geocodeErrors.push({
                        index: index,
                        message: `no geolocation found for ${c.location?.query}`,
                    });
                }
            } catch (err) {
                if (err instanceof InvalidParamError) {
                    geocodeErrors.push({
                        index: index,
                        message: err.message,
                    });
                } else {
                    throw err;
                }
            }
        }
        return geocodeErrors;
    }
}
