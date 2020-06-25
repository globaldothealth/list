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
    // TODO: add other travel history fields
    travelHistory: Loc[];
    sourceUrl: string;
    notes: string;
}
