import { Request, Response } from 'express';

import axios, { AxiosResponse } from 'axios';
import countries from 'i18n-iso-countries';
import db from '../model/database';

import { logger } from '../util/logger';

/**
 * Dumb proxy to geocoder in location service
 * For the most part, anyway: see countryNames
 */
export default class GeocodeProxy {
    constructor(private readonly locationServiceURL: string) {}

    suggest = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.locationServiceURL + req.url,
            );
            res.status(response.status).json(response.data);
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

    convertUTM = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = await axios.get(
                this.locationServiceURL + req.url,
            );
            res.status(response.status).json(response.data);
            return;
        } catch (err) {
            logger.error(err as Error);
            if (axios.isAxiosError(err)) {
                res.status(err.response!.status).send(err.response!.data);
                return;
            }
        }
    }

    /**
     * This is the only "meaty" method on this controller. It does proxy the
     * location service, but it also uses the database and two npm modules to
     * find out what ISO-3166-1 country codes are in use in the database and
     * what names are used for those countries.
     * @param req Express request
     * @param res Express response
     */
    countryNames = async (req: Request, res: Response): Promise<void> => {
        const database = db();
        const locationCountryCodes = await database.collection('cases').distinct('location.country');
        const travelHistoryCodes = await database.collection('cases').distinct('travelHistory.travel.location.country');
        const allCodes = new Set<string>(locationCountryCodes.concat(travelHistoryCodes));
        const namesMap: {
            [key: string]: string[] | undefined
        } = {};
        for (const code of allCodes) {
            const names = countries.getName(code, 'en', { select: 'all' });
            // ask the geocoding service what name it uses
            try {
                const res = await axios.get<string, AxiosResponse<string>>(
                    this.locationServiceURL + `/geocode/countryName?c=${code}`
                )
                const geocodeName = res.data;
                if (names.indexOf(geocodeName) < 0) {
                    names.push(geocodeName);
                }
            }
            catch (err) {
                // doesn't matter, weird that geocoding service doesn't have this code though
                logger.warn(`geocoding service doesn't have a name for country code ${code} found in the DB!`);
            }
            namesMap[code] = names;
        }
        res.status(200).json(namesMap);
    }

    seed = async (req: Request, res: Response): Promise<void> => {
        const response = await axios.post(
            this.locationServiceURL + req.url,
            req.body,
        );
        res.status(response.status).send();
    };

    clear = async (req: Request, res: Response): Promise<void> => {
        const response = await axios.post(
            this.locationServiceURL + req.url,
            req.body,
        );
        res.status(response.status).send();
    };
}
