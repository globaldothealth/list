import { GeocodeOptions, GeocodeResult } from './geocoder';
import axios from 'axios';

export default class RemoteGeocoder {
    constructor(private readonly baseUrl: string) {}

    async geocode(
        query: string,
        opts?: GeocodeOptions,
    ): Promise<GeocodeResult[]> {
        const result = await axios.get(this.baseUrl + '/geocode', {
            params: {
                q: query,
                ...opts,
            },
        });
        return result.data;
    }
}
