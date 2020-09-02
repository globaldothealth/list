import { CaseReferenceForm } from '../common-form-fields/Source';

export default interface BulkCaseFormValues {
    file: File | null;
    caseReference?: CaseReferenceForm;
}
