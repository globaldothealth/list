import { Location as Loc } from '../Case';

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
    traveledPrior30Days?: string;
    travelHistory: Travel[];
    genomeSequences: GenomeSequence[];
    pathogens: Pathogen[];
    sourceUrl: string;
    notes: string;
}

export interface Travel {
    // Used to key react elements in the UI
    reactId: string;
    location: Loc;
    dateRange: {
        start: string | null;
        end: string | null;
    };
    purpose?: string;
    method?: string;
}

export interface GenomeSequence {
    // Used to key react elements in the UI
    reactId: string;
    sampleCollectionDate: string | null;
    repositoryUrl?: string;
    sequenceId?: string;
    sequenceName?: string;
    sequenceLength?: number;
}

interface Pathogen {
    name: string;
    id: number;
}
