import { Request, Response } from 'express';
import { IUser, users } from '../model/user';
import axios, { AxiosError } from 'axios';
import { logger } from '../util/logger';
import AWS from 'aws-sdk';
import crypto from 'crypto';
import { ModifyResult, ObjectId } from 'mongodb';

// Don't set client-side timeouts for requests to the data service.
// TODO: Make this more fine-grained once we fix
//   https://github.com/globaldothealth/list/issues/961.
axios.defaults.timeout = 0;

// The query (URL) when the line list first loads
const defaultInputQuery = '/cases';
const defaultOutputQuery =
    '/cases/?limit=50&page=1&count_limit=10000&sort_by=default&order=ascending';

/**
 * CasesController mostly forwards case-related requests to the data service.
 * It handles CRUD operations from curators.
 */
export default class CasesController {
    constructor(
        private readonly dataServerURL: string,
        private readonly completeDataBucket: string,
        private readonly countryDataBucket: string,
        private readonly s3Client: AWS.S3,
    ) {}

    /** List simply forwards the request to the data service */
    list = async (req: Request, res: Response): Promise<void> => {
        let query;
        if (req.url === defaultInputQuery) {
            query = defaultOutputQuery;
        } else {
            query = req.url;
            logger.info(`Applying filter: ${query}`);
        }
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + query,
            );
            if (response.status >= 400) {
                logger.error(
                    `A server error occurred when trying to list data using URL: ${query}. Response status code: ${response.status}`,
                );
            }
            res.status(response.status).json(response.data);
        } catch (e) {
            const err = e as AxiosError;
            logger.error(
                `Exception thrown by axios accessing URL: ${query}`,
                err,
            );
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    private logOutcomeOfAppendingDownloadToUser(
        userId: string,
        result: ModifyResult<IUser>,
    ) {
        if (!result.ok) {
            logger.error(
                `Error adding download to user: ${result.lastErrorObject}`,
            );
        } else {
            logger.info(`Added download to user ${userId}`);
        }
    }

    /** Download forwards the request to the data service and streams the
     * streamed response as an attachment. */
    download = async (req: Request, res: Response): Promise<void> => {
        const correlationId = crypto.randomBytes(16).toString('hex');
        req.body.correlationId = correlationId;
        try {
            const user = req.user as IUser;
            const result = await users().findOneAndUpdate(
                { _id: new ObjectId(user.id) },
                {
                    $push: {
                        downloads: {
                            timestamp: new Date(),
                            format: req.body.format,
                            query: req.body.query,
                        },
                    },
                },
            );
            this.logOutcomeOfAppendingDownloadToUser(user.id, result);

            axios({
                method: 'post',
                url: this.dataServerURL + '/api' + req.url,
                data: req.body,
                responseType: 'stream',
            }).then((response) => {
                res.setHeader('Content-Type', response.headers['content-type']);
                res.setHeader(
                    'Content-Disposition',
                    response.headers['content-disposition'],
                );
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Pragma', 'no-cache');
                response.data.pipe(res);
            });
        } catch (err) {
            const error = err as AxiosError;
            logger.error(error);
            if (error.response?.status && error.response?.data) {
                res.status(error.response.status).send(error.response.data);
                return;
            }
            res.status(500).send(error);
        }
    };

    /** DownloadAsync forwards the request to the data service and streams its
     * streamed response to the client.
     **/
    downloadAsync = async (req: Request, res: Response): Promise<void> => {
        if (req.body.format == 'csv' && !req.body.caseIds && !req.body.query) {
            this.getDownloadLink(req, res);
            return;
        } else if (this.hasCountryOnly(req.body.query)) {
            const country = req.body.query.split(':')[1].toUpperCase(); // capitalise ISO code
            const inBucket = await this.S3BucketContains(
                country,
                req.body.format,
            );
            if (inBucket) {
                this.getCountryDownloadLink(req, res, country, req.body.format);
                return;
            }
        }
        try {
            const user = req.user as IUser;
            const url =
                this.dataServerURL + '/api' + req.url.replace('Async', '');
            req.body.correlationId = crypto.randomBytes(16).toString('hex');
            logger.info(
                `Streaming case data in format ${req.body.format} matching query ${req.body.query} for correlation ID ${req.body.correlationId}`,
            );
            const result = await users().findOneAndUpdate(
                {
                    _id: new ObjectId(user.id),
                },
                {
                    $push: {
                        downloads: {
                            timestamp: new Date(),
                            format: req.body.format,
                            query: req.body.query,
                        },
                    },
                },
            );

            this.logOutcomeOfAppendingDownloadToUser(user.id, result);

            axios({
                method: 'post',
                url: url,
                data: req.body,
                responseType: 'stream',
            }).then((response) => {
                res.setHeader('Content-Type', response.headers['content-type']);
                res.setHeader(
                    'Content-Disposition',
                    response.headers['content-disposition'],
                );
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Pragma', 'no-cache');
                response.data.pipe(res);
            });
        } catch (err) {
            const error = err as AxiosError;
            logger.error(error);
            if (error.response?.status && error.response?.data) {
                res.status(error.response.status).send(error.response.data);
                return;
            }
            res.status(500).send(error);
        }
    };

    /* getDownloadLink generates signed URL to download full data set from AWS S3 */
    getDownloadLink = async (req: Request, res: Response): Promise<void> => {
        const dateObj = new Date();

        // adjust 0 before single digit date
        const day = ('0' + dateObj.getDate()).slice(-2);
        const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        const year = dateObj.getFullYear();

        const filename = `gh_${year}-${month}-${day}.tar`;

        const params = {
            Bucket: this.completeDataBucket,
            Key: 'latest/latestdata-csv.tar',
            Expires: 5 * 60,
            ResponseContentDisposition:
                'attachment; filename ="' + filename + '"',
        };

        const user = req.user as IUser;

        try {
            const signedUrl: string = await new Promise((resolve, reject) => {
                this.s3Client.getSignedUrl('getObject', params, (err, url) => {
                    if (err) reject(err);

                    resolve(url);
                });
            });

            const result = await users().findOneAndUpdate(
                { _id: new ObjectId(user.id) },
                {
                    $push: {
                        downloads: {
                            timestamp: new Date(),
                        },
                    },
                },
            );
            this.logOutcomeOfAppendingDownloadToUser(user.id, result);

            res.status(200).send({ signedUrl });
        } catch (err) {
            res.status(500).send(err);
        }

        return;
    };

    /* getCountryDownloadLink generates signed URL to download national data set from AWS S3 */
    getCountryDownloadLink = async (
        req: Request,
        res: Response,
        country: string,
        format: string,
    ): Promise<void> => {
        const filename = `${country}.${format}.gz`;
        const filepath = `${format}/${filename}`;
        const params = {
            Bucket: this.countryDataBucket,
            Key: filepath,
            Expires: 5 * 60,
            ResponseContentDisposition:
                'attachment; filename ="' + filename + '"',
        };

        const user = req.user as IUser;

        try {
            const signedUrl: string = await new Promise((resolve, reject) => {
                this.s3Client.getSignedUrl('getObject', params, (err, url) => {
                    if (err) reject(err);

                    resolve(url);
                });
            });

            const result = await users().findOneAndUpdate(
                { _id: new ObjectId(user.id) },
                {
                    $push: {
                        downloads: {
                            timestamp: new Date(),
                            format: format,
                            query: country,
                        },
                    },
                },
            );
            this.logOutcomeOfAppendingDownloadToUser(user.id, result);

            res.status(200).send({ signedUrl });
        } catch (err) {
            res.status(500).send(err);
        }

        return;
    };

    /** hasCountryOnly checks the query string to see whether it contains only a filter for a nation **/
    hasCountryOnly = (queryString: string): boolean => {
        const split = queryString.split(':');
        if (split.length == 2 && split[0] === 'country') {
            return true;
        }
        return false;
    };

    /** S3BucketContains checks AWS storage to see whether it contains a desired file **/
    S3BucketContains = async (
        country: string,
        format: string,
    ): Promise<boolean> => {
        const filepath = `${format}/${country}.${format}.gz`;
        const contains = await this.s3Client
            .headObject({
                Bucket: this.countryDataBucket,
                Key: filepath,
            })
            .promise()
            .then(
                () => true,
                (err) => {
                    return false;
                },
            );
        return contains;
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
        } catch (e) {
            const err = e as AxiosError;
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
        } catch (e) {
            const err = e as AxiosError;
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
        } catch (e) {
            const err = e as AxiosError;
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
            if (!(req.user as IUser)?.roles?.includes('admin')) {
                req.body['maxCasesThreshold'] = 10000;
            }
            const response = await axios.delete(
                this.dataServerURL + '/api' + req.url,
                { data: req.body },
            );
            res.status(response.status).end();
        } catch (e) {
            const err = e as AxiosError;
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
        } catch (e) {
            const err = e as AxiosError;
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
                    curator: { email: (req.user as IUser).email },
                },
            );
            res.status(response.status).json(response.data);
        } catch (e) {
            const err = e as AxiosError;
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
                    curator: { email: (req.user as IUser).email },
                },
            );
            res.status(response.status).json(response.data);
        } catch (e) {
            const err = e as AxiosError;
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
                    curator: { email: (req.user as IUser).email },
                },
                { maxContentLength: Infinity },
            );
            res.status(upsertResponse.status).send(upsertResponse.data);
            return;
        } catch (e) {
            const err = e as AxiosError;
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
                    curator: { email: (req.user as IUser).email },
                },
                { maxContentLength: Infinity },
            );
            res.status(200).send({
                numModified: updateResponse.data.numModified,
            });
            return;
        } catch (e) {
            const err = e as AxiosError;
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
                    curator: { email: (req.user as IUser).email },
                },
                { maxContentLength: Infinity },
            );
            res.status(200).send({
                numModified: updateResponse.data.numModified,
            });
            return;
        } catch (e) {
            const err = e as AxiosError;
            logger.error(err);
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    /**
     * batchStatusChange forwards the query to the data service.
     * It does set the curator in the request to the data service based on the
     * currently logged-in user.
     */
    batchStatusChange = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.post(
                this.dataServerURL + '/api/cases/batchStatusChange',
                {
                    ...req.body,
                    curator: { email: (req.user as IUser).email },
                },
            );
            res.status(response.status).end();
        } catch (e) {
            const err = e as AxiosError;
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
                    curator: { email: (req.user as IUser).email },
                },
            );
            res.status(response.status).json(response.data);
        } catch (e) {
            const err = e as AxiosError;
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };

    /**
     * batchStatusChange forwards the query to the data service.
     * It does set the curator in the request to the data service based on the
     * currently logged-in user.
     */
    listExcludedCaseIds = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        try {
            const response = await axios.get(
                this.dataServerURL + '/api' + req.url,
            );
            res.status(response.status).json(response.data);
        } catch (e) {
            const err = e as AxiosError;
            if (err.response?.status && err.response?.data) {
                res.status(err.response.status).send(err.response.data);
                return;
            }
            res.status(500).send(err);
        }
    };
}
