// A single result from a Geocoder.
export interface GeocodeResult {
    geometry: {
        latitude: number;
        longitude: number;
    };
    country: string;
    // First administrative division (state in the US, Länder in Germany, ...).
    administrativeAreaLevel1: string | undefined;
    // Second administrative division (county in the US, departments in France, ...).
    administrativeAreaLevel2: string | undefined;
    // Third administrative division (cities usually).
    administrativeAreaLevel3: string | undefined;
    // A precise location, such as an establishment or POI.
    place: string | undefined;
    // Human readable place name.
    name: string;
    // How granular the geocode is.
    geoResolution: Resolution;
}

export enum Resolution {
    Point = 'Point',
    Admin3 = 'Admin3',
    Admin2 = 'Admin2',
    Admin1 = 'Admin1',
    Country = 'Country',
}

export interface GeocodeOptions {
    // If set, will only return features with the given resolutions.
    // Otherwise all available resolutions can be returned.
    limitToResolution?: Resolution[];
}

// A geocoder can geocode queries into places.
export interface Geocoder {
    geocode(query: string, opts?: GeocodeOptions): Promise<GeocodeResult[]>;
}
