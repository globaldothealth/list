import { Admin } from '../model/admin';
import { GeocodeResult } from './geocoder';
import LRUCache from 'lru-cache';
import axios from 'axios';
import { logger } from '../util/logger';

// Mapbox boundaries types definitions, not part of the mapbox SDK.
interface BoundariesResponse {
    features: Feature[];
}

interface Feature {
    properties: Properties;
}

interface Properties {
    id: string;
    tilequery: Tilequery;
}

interface Tilequery {
    layer: string;
}

/**
 * Mapbox administrative area fetcher using the boundaries API.
 * https://www.mapbox.com/boundaries/.
 *
 * Some geocoding results do not contain the full administrative area details,
 * such details can be subsequently fetched using the boundaries API by doing a
 * tilequery fetch of the center of the geocode result with the administrative
 * boundaries layers.
 * Cf. https://docs.mapbox.com/help/glossary/tilequery-api/
 * It uses a mapping of mapbox administrative areas IDs to their names stored
 * in the admins Mongo DB collection.
 */
export default class MapboxAdminsFetcher {
    private cache: LRUCache<GeocodeResult, BoundariesResponse>;
    constructor(private readonly accessToken: string) {
        this.cache = new LRUCache<GeocodeResult, BoundariesResponse>({
            max: 500,
        });
    }

    /** Fill in missing admin levels for the given GeocodeResult. */
    async fillAdmins(geocode: GeocodeResult): Promise<void> {
        // Return early if no need to fill in admins.
        if (
            geocode.administrativeAreaLevel1 &&
            geocode.administrativeAreaLevel2 &&
            geocode.administrativeAreaLevel3
        ) {
            return;
        }
        const cachedResult = this.cache.get(geocode);
        let resp: BoundariesResponse;
        if (cachedResult) {
            resp = cachedResult;
        } else {
            // Fetch all missing admins in one query.
            const url = `https://api.mapbox.com/v4/mapbox.enterprise-boundaries-a1-v2,mapbox.enterprise-boundaries-a2-v2,mapbox.enterprise-boundaries-a3-v2/tilequery/${geocode.geometry.longitude},${geocode.geometry.latitude}.json?access_token=${this.accessToken}`;
            try {
                resp = (await axios.get<BoundariesResponse>(url)).data;
                this.cache.set(geocode, resp);
            } catch (e) {
                // Fail gracefully, not being able to fetch all admins isn't a huge deal.
                logger.error(`Retrieving admins from url: ${url}:`, e);
                return;
            }
        }
        for (const feature of resp.features) {
            switch (feature.properties.tilequery.layer) {
                case 'boundaries_admin_1':
                    geocode.administrativeAreaLevel1 =
                        (await this.getName(feature.properties.id)) ||
                        undefined;
                case 'boundaries_admin_2':
                    geocode.administrativeAreaLevel2 =
                        (await this.getName(feature.properties.id)) ||
                        undefined;
                case 'boundaries_admin_3':
                    geocode.administrativeAreaLevel3 =
                        (await this.getName(feature.properties.id)) ||
                        undefined;
            }
            // Necessary because the schema doesn't accept undefined values
            if (geocode.administrativeAreaLevel1 === undefined) {
                delete geocode.administrativeAreaLevel1;
            }
            if (geocode.administrativeAreaLevel2 === undefined) {
                delete geocode.administrativeAreaLevel2;
            }
            if (geocode.administrativeAreaLevel3 === undefined) {
                delete geocode.administrativeAreaLevel3;
            }
        }
    }

    async getName(id: string): Promise<string> {
        return (await Admin.findOne({ id: id }, 'name').exec())?.name || '';
    }
}
