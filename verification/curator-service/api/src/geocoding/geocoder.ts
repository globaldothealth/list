// A single result from a Geocoder.
export interface GeocodeResult {
    geometry: {
        latitude: number;
        longitude: number;
    };
    country: string;
    // First administrative division (regions in the US, Länder in Germany, ...).
    administrativeAreaLevel1: string | undefined;
    // Second administrative division (county in the US, departments in France, ...).
    administrativeAreaLevel2: string | undefined;
    locality: string | undefined;
    // Human readable place name.
    text: string;
}

// A geocoder can geocode queries into places.
export interface Geocoder {
    geocode(query: string): Promise<GeocodeResult[]>;
}
