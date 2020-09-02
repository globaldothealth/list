// Case definitions as defined by the /api/cases endpoint.
export enum VerificationStatus {
    Unverified = 'UNVERIFIED',
    Verified = 'VERIFIED',
}

export interface CaseReference {
    sourceId: string;
    sourceEntryId?: string;
    sourceUrl: string;
    uploadId?: string;
    verificationStatus?: VerificationStatus;
    additionalSources?: [
        {
            sourceUrl: string;
        },
    ];
}

export interface Event {
    name: string;
    dateRange?: {
        start?: string;
        end?: string;
    };
    value?: string;
}

export interface Demographics {
    gender: string;
    ageRange: {
        start: number;
        end: number;
    };
    ethnicity: string;
    nationalities: string[];
    occupation: string;
}

export interface PreexistingConditions {
    hasPreexistingConditions: boolean;
    values: string[];
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
    // These two fields are either required or supplemental for requests, but
    // aren't part of the returned case objects.
    // Required to perform geocoding.
    query?: string;
    // Optional to hint geocoding results.
    limitToResolution?: string;
}

export interface Geometry {
    latitude: number;
    longitude: number;
}

export interface Symptoms {
    status: string;
    values: string[];
}

export interface Transmission {
    routes: string[];
    places: string[];
    linkedCaseIds: string[];
}

export interface TravelHistory {
    traveledPrior30Days?: boolean;
    travel: Travel[];
}

export interface Travel {
    location: Location;
    dateRange: {
        start: string;
        end: string;
    };
    purpose?: string;
    methods: string[];
}

export interface GenomeSequence {
    sampleCollectionDate: string | null;
    repositoryUrl?: string;
    sequenceId?: string;
    sequenceName?: string;
    sequenceLength?: number;
    notes?: string;
}

export interface Pathogen {
    name: string;
    id: number;
}

interface Revision {
    curator: string;
    date: string;
}

interface RevisionMetadata {
    revisionNumber: number;
    creationMetadata: Revision;
    updateMetadata?: Revision;
}

export interface Case {
    _id: string;
    caseReference: CaseReference;
    importedCase?: {
        outcome?: string;
    };
    events: Event[];
    demographics: Demographics;
    location: Location;
    symptoms: Symptoms;
    preexistingConditions?: PreexistingConditions;
    transmission: Transmission;
    travelHistory: TravelHistory;
    genomeSequences: GenomeSequence[];
    pathogens: Pathogen[];
    notes: string;
    revisionMetadata: RevisionMetadata;
}
