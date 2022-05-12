// Case definitions as defined by the /api/cases endpoint.
export enum VerificationStatus {
    Unverified = 'UNVERIFIED',
    Verified = 'VERIFIED',
    Excluded = 'EXCLUDED',
}

export interface CaseReference {
    sourceId: string;
    sourceEntryId?: string;
    sourceUrl: string;
    uploadIds?: string[];
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

export interface Geometry {
    latitude: number;
    longitude: number;
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
    // Set this field to perform geocoding and fill the rest of the location object.
    query?: string;
    // Optional to hint geocoding results.
    limitToResolution?: string;
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

export interface Travel {
    location: Location;
    dateRange: {
        start: string;
        end: string;
    };
    purpose?: string;
    methods: string[];
}

export interface TravelHistory {
    traveledPrior30Days?: boolean;
    travel: Travel[];
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

export interface Variant {
    name?: string;
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

export interface ExclusionData {
    date: string;
    note: string;
}

export interface Vaccine {
    name: string;
    batch: string;
    date: Date;
    sideEffects: Symptoms;
    previousInfection: 'yes' | 'no' | 'NA';
    previousInfectionDetectionMethod: string;
}

export interface Case {
    _id: string;
    caseReference: CaseReference;
    list: boolean;
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
    exclusionData?: ExclusionData;
    variant?: Variant;
    SGTF?: string;
    isSourceExcluded?: boolean;
    vaccines: Vaccine[];
    confirmationDate: Date;
}
