import { Request, Response } from 'express';

import { UserDocument } from '../model/user';
import axios from 'axios';
import { logger } from '../util/logger';

// Don't set client-side timeouts for requests to the data service.
// TODO: Make this more fine-grained once we fix
//   https://github.com/globaldothealth/list/issues/961.
axios.defaults.timeout = 0;

/**
 * CasesController mostly forwards case-related requests to the data service.
 * It handles CRUD operations from curators.
 */
export default class CasesController {
    constructor(private readonly dataServerURL: string) {}

    /** List simply forwards the request to the data service */
    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            logger.error(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    todaysDate = (): string => {
        const today = new Date();
        return `${today.getFullYear()}_${
            today.getMonth() + 1
        }_${today.getDate()}`;
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
                    `attachment; filename="globalhealth_covid19_cases_${this.todaysDate()}.csv"`,
                );
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Pragma', 'no-cache');
                response.data.pipe(res);
            });
        } catch (err) {
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    /**
     * upsert forwards the request to the data service.
     */
    upsert = async (req: Request, res: Response): Promise<void> => {
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
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    /**
     * Upserts the provided cases.
     */
    batchUpsert = async (req: Request, res: Response): Promise<void> => {
        try {
            const upsertResponse = await axios.post(
                this.dataServerURL + '/api/cases/batchUpsert',
                {
                    ...req.body,
                    curator: { email: (req.user as UserDocument).email },
                },
                { maxContentLength: Infinity },
            );
            res.status(upsertResponse.status).send(upsertResponse.data);
            return;
        } catch (err) {
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    /**
     * create forwards the query to the data service.
     * It does set the curator in the request to the data service based on the
     * currently logged-in user.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.post(
                this.dataServerURL + '/api' + req.url,
                {
                    ...req.body,
                    curator: { email: (req.user as UserDocument).email },
                },
            );
            res.status(response.status).json(response.data);
        } catch (err) {
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };
}
