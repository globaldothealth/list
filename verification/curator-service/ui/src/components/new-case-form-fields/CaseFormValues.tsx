import { CaseReferenceForm } from '../common-form-fields/Source';
import { Location as Loc } from '../Case';

/**
 * CaseFormValues defines all the values contained in the manual case entry form.
 */
export default interface CaseFormValues {
    caseReference?: CaseReferenceForm;
    gender?: string;
    minAge?: number;
    maxAge?: number;
    age?: number;
    ethnicity?: string;
    nationalities: string[];
    occupation?: string;
    location?: Loc;
    confirmedDate: string | null;
    methodOfConfirmation?: string;
    onsetSymptomsDate: string | null;
    firstClinicalConsultationDate: string | null;
    selfIsolationDate: string | null;
    admittedToHospital?: string;
    hospitalAdmissionDate: string | null;
    admittedToIcu?: string;
    icuAdmissionDate: string | null;
    outcomeDate: string | null;
    outcome?: string;
    symptomsStatus?: string;
    symptoms: string[];
    hasPreexistingConditions?: string;
    preexistingConditions: string[];
    transmissionRoutes: string[];
    transmissionPlaces: string[];
    transmissionLinkedCaseIds: string[];
    traveledPrior30Days?: string;
    travelHistory: Travel[];
    genomeSequences: GenomeSequence[];
    pathogens: Pathogen[];
    notes: string;
    numCases?: number;
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
    methods: string[];
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
