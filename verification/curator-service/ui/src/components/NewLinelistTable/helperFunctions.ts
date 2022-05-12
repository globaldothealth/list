import { VerificationStatus, ExclusionData } from '../../api/models/Case';

export const labels = [
    'Case ID',
    'Confirmation date',
    'Admin 3',
    'Admin 2',
    'Admin 1',
    'Country',
    'Latitude',
    'Longitude',
    'Nationality',
    'Age',
    'Gender',
    'Outcome',
    'Hospitalization date/period',
    'Symptoms onset date',
    'Source URL',
];

export const createData = (
    caseId: string,
    confirmedDate?: string,
    admin3?: string,
    admin2?: string,
    admin1?: string,
    country?: string,
    latitude?: number | string,
    longitude?: number | string,
    nationality?: string[],
    age?: string,
    gender?: string,
    outcome?: string,
    hospitalizationDate?: string,
    symptomsOnsetDate?: string,
    sourceUrl?: string,
    verificationStatus?: VerificationStatus,
    exclusionData?: ExclusionData,
) => {
    return {
        caseId,
        confirmedDate,
        admin3,
        admin2,
        admin1,
        country,
        latitude,
        longitude,
        nationality,
        age,
        gender,
        outcome,
        hospitalizationDate,
        symptomsOnsetDate,
        sourceUrl,
        verificationStatus,
        exclusionData,
    };
};

export const parseAge = (
    ageStart: number | undefined,
    ageEnd: number | undefined,
) => {
    if (!ageStart || !ageEnd) return '';
    if (ageStart === ageEnd) return ageStart?.toString() ?? '';

    return `${ageStart} - ${ageEnd}`;
};
