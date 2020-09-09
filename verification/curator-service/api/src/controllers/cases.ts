import { GeocodeOptions, Geocoder, Resolution } from '../geocoding/geocoder';
import { Request, Response } from 'express';

import { UserDocument } from '../model/user';
import axios from 'axios';

// Don't set client-side timeouts for requests to the data service.
// TODO: Make this more fine-grained once we fix
//   https://github.com/globaldothealth/list/issues/961.
axios.defaults.timeout = 0;

class InvalidParamError extends Error {}

/**
 * CasesController mostly forwards case-related requests to the data service.
 * It handles CRUD operations from curators.
 */
export default class CasesController {
    constructor(
        private readonly dataServerURL: string,
        private readonly geocoders: Geocoder[],
    ) {}

    /** List simply forwards the request to the data service */
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

    /** Download forwards the request to the data service and streams the
     * streamed response as a csv attachment. */
    download = async (req: Request, res: Response): Promise<void> => {
        try {
            axios({
                method: 'post',
                url: this.dataServerURL + '/api' + req.url,
                data: req.body,
                responseType: 'stream',
            }).then((response) => {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader(
                    'Content-Disposition',
                    'attachment; filename="cases.csv"',
                );
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Pragma', 'no-cache');
                response.data.pipe(res);
            });
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    /** listSymptoms simply forwards the request to the data service */
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

    /** listPlacesOfTransmission simply forwards the request to the data service */
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

    /** listOccupations simply forwards the request to the data service */
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

    /** get simply forwards the request to the data service */
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

    /** batchDel simply forwards the request to the data service */
    batchDel = async (req: Request, res: Response): Promise<void> => {
        try {
            // Limit number of deletes a non-admin can do.
            // Cf. https://github.com/globaldothealth/list/issues/937.
            if (!(req.user as UserDocument)?.roles?.includes('admin')) {
                req.body['maxCasesThreshold'] = 10000;
            }
            const response = await axios.delete(
                this.dataServerURL + '/api' + req.url,
                { data: req.body },
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

    /** del simply forwards the request to the data service */
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

    /** update simply forwards the request to the data service */
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

    /**
     * upsert will try to geocode the location found in the request if needed
     * and then will forwards the request with the added geolocation to the
     * data service
     */
    upsert = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!(await this.geocode(req))) {
                res.status(404).send({
                    message: `no geolocation found for ${req.body['location']?.query}`,
                });
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
                res.status(422).send(err);
                return;
            }
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
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
                    numCreated: 0,
                    numUpdated: 0,
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
                    numCreated: 0,
                    numUpdated: 0,
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
                numCreated: upsertResponse.data.numCreated,
                numUpdated: upsertResponse.data.numUpdated,
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

    /**
     * batchUpdate simply forwards the request to the data service.
     * It does set the curator in the request to the data service based on the
     * currently logged-in user.
     */
    batchUpdate = async (req: Request, res: Response): Promise<void> => {
        try {
            const updateResponse = await axios.post(
                this.dataServerURL + '/api/cases/batchUpdate',
                {
                    ...req.body,
                    curator: { email: (req.user as UserDocument).email },
                },
                { maxContentLength: Infinity },
            );
            res.status(200).send({
                numModified: updateResponse.data.numModified,
            });
            return;
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    /**
     * batchUpdateQuery simply forwards the request to the data service.
     * It does set the curator in the request to the data service based on the
     * currently logged-in user.
     */
    batchUpdateQuery = async (req: Request, res: Response): Promise<void> => {
        try {
            const updateResponse = await axios.post(
                this.dataServerURL + '/api/cases/batchUpdateQuery',
                {
                    ...req.body,
                    curator: { email: (req.user as UserDocument).email },
                },
                { maxContentLength: Infinity },
            );
            res.status(200).send({
                numModified: updateResponse.data.numModified,
            });
            return;
        } catch (err) {
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    /**
     * create tries to geocode the location of the case if needed and then
     * forwards the query to the data service.
     * It does set the curator in the request to the data service based on the
     * currently logged-in user.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!(await this.geocode(req))) {
                res.status(404).send({
                    message: `no geolocation found for ${req.body['location']?.query}`,
                });
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
                res.status(422).send(err);
                return;
            }
            console.log(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
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
     * TODO: Use a batch geocode API like https://docs.mapbox.com/api/search/#batch-geocoding.
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
