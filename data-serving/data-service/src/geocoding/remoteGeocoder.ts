import { GeocodeOptions, GeocodeResult } from './geocoder';
import axios from 'axios';
import { logger } from '../util/logger';

export default class RemoteGeocoder {
    constructor(private readonly baseUrl: string) {}

    async geocode(
        query: string,
        opts?: GeocodeOptions,
    ): Promise<GeocodeResult[]> {
        try {
            const result = await axios.get(this.baseUrl + '/geocode', {
                params: {
                    q: query,
                    ...opts,
                },
            });
            return result.data;
        } catch (error) {
            logger.error({
                msg: 'Error from geocoding service',
                error,
                query,
            });
            return [];
        }
    }
}
