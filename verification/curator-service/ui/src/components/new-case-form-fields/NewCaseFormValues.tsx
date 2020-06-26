import { Loc } from './Location';

export default interface NewCaseFormValues {
    sex?: string;
    minAge?: number;
    maxAge?: number;
    age?: number;
    ethnicity?: string;
    nationalities: string[];
    profession?: string;
    location?: Loc;
    confirmedDate: string | null;
    methodOfConfirmation?: string;
    onsetSymptomsDate: string | null;
    firstClinicalConsultationDate: string | null;
    selfIsolationDate: string | null;
    admittedToHospital?: string;
    hospitalAdmissionDate: string | null;
    icuAdmissionDate: string | null;
    outcomeDate: string | null;
    outcome?: string;
    symptoms: string[];
    transmissionRoutes: string[];
    transmissionPlaces: string[];
    transmissionLinkedCaseIds: string[];
    travelHistory: Travel[];
    genomeSequences: GenomeSequence[];
    sourceUrl: string;
    notes: string;
}

interface Travel {
    location: Loc;
    dateRange: {
        start: string | null;
        end: string | null;
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
