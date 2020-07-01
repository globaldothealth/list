// Case definitions as returned by the /api/cases endpoint.
export interface Event {
    name: string;
    dateRange?: {
        start?: string;
        end?: string;
    };
    value?: string;
}

export interface Demographics {
    sex: string;
    ageRange: {
        start: number;
        end: number;
    };
    ethnicity: string;
    nationalities: string[];
    profession: string;
}

export interface Location {
    country: string;
    administrativeAreaLevel1: string;
    administrativeAreaLevel2: string;
    administrativeAreaLevel3: string;
    geoResolution: string;
    geometry: Geometry;
    name: string;
    place: string;
}

export interface Geometry {
    latitude: number;
    longitude: number;
}

export interface Source {
    url: string;
}

export interface Symptoms {
    values: string[];
}

export interface Transmission {
    routes: string[];
    places: string[];
    linkedCaseIds: string[];
}

export interface TravelHistory {
    travel: Travel[];
}

export interface Travel {
    location: Location;
    dateRange: {
        start: string;
        end: string;
    };
    purpose?: string;
    method?: string;
}

interface GenomeSequence {
    sampleCollectionDate: string | null;
    repositoryUrl?: string;
    sequenceId?: string;
    sequenceName?: string;
    sequenceLength?: number;
    notes?: string;
}

interface Revision {
    curator: string;
    date: string;
}

interface RevisionMetadata {
    creationMetadata: Revision;
}

export interface Case {
    _id: string;
    importedCase?: {
        outcome?: string;
    };
    events: Event[];
    demographics: Demographics;
    location: Location;
    symptoms: Symptoms;
    transmission: Transmission;
    sources: Source[];
    travelHistory: TravelHistory;
    genomeSequences: GenomeSequence[];
    notes: string;

    revisionMetadata: RevisionMetadata;
}
