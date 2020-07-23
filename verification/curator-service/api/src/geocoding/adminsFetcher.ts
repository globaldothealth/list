import { GeocodeResult, Resolution } from './geocoder';

import axios from 'axios';

/**
 * Mapbox administrative area fetcher using the boundaries API.
 * https://www.mapbox.com/boundaries/.
 *
 * Some geocoding results do not contain the full administrative area details,
 * such details can be subsequently fetched using the boundaries API by doing a
 * tilequery fetch of the center of the geocode result with the administrative
 * boundaries layers.
 * Cf. https://docs.mapbox.com/help/glossary/tilequery-api/
 *
 * TODO: Explain the custom local fetches of names once implemented.
 */
export default class MapboxAdminsFetcher {
    constructor(private readonly accessToken: string) {}

    // Fill in missing admin levels for the given GeocodeResult.
    async fillAdmins(geocode: GeocodeResult): Promise<void> {
        // Get missing admins from geocode result.
        const missingAdmins = new Set<Resolution>();
        if (geocode.administrativeAreaLevel1 === '') {
            missingAdmins.add(Resolution.Admin1);
        }
        if (geocode.administrativeAreaLevel2 === '') {
            missingAdmins.add(Resolution.Admin2);
        }
        if (geocode.administrativeAreaLevel3 === '') {
            missingAdmins.add(Resolution.Admin3);
        }
        if (missingAdmins.size === 0) {
            return;
        }
        // Fetch all missing admins in one query.
        const url = `https://api.mapbox.com/v4/${getLayersParam(
            missingAdmins,
        )}/tilequery/${geocode.geometry.longitude},${
            geocode.geometry.latitude
        }.json?access_token=${this.accessToken}`;
        try {
            const resp = await axios.get(url);
            const features = (resp.data as BoundariesResponse).features;
            features.forEach((feature) => {
                switch (feature.properties.tilequery.layer) {
                    case 'boundaries_admin_1':
                    // TODO: Get name from prop.id and put in geocode.administrativeAreaLevel1;
                    case 'boundaries_admin_2':
                    // TODO: Get name from prop.id and put in geocode.administrativeAreaLevel2;
                    case 'boundaries_admin_3':
                    // TODO: Get name from prop.id and put in geocode.administrativeAreaLevel3;
                }
            });
        } catch (e) {
            // Fail gracefully, not being able to fetch all admins isn't a huge deal.
            console.error(`Retrieving admins from url: ${url}:`, e);
            return;
        }
    }
}

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

// Map of admin resolutions to their URL params counterpart in the mapbox boundaries API.
const adminToLayer = new Map<Resolution, string>([
    [Resolution.Admin1, 'mapbox.enterprise-boundaries-a1-v2'],
    [Resolution.Admin2, 'mapbox.enterprise-boundaries-a2-v2'],
    [Resolution.Admin3, 'mapbox.enterprise-boundaries-a3-v2'],
]);

// getLayersParams return the layers query param used by the mapbox boundaries API based on missing admin levels.
function getLayersParam(admins: Set<Resolution>): string {
    const layers = [];
    for (const admin of admins) {
        layers.push(adminToLayer.get(admin));
    }
    return layers.sort().join(',');
}
