// A single result from a Geocoder.
export interface GeocodeResult {
    lat: number;
    lng: number;
}

// A geocoder can geocode queries into places.
export interface Geocoder {
    geocode(query: string): Promise<GeocodeResult[]>;
}
