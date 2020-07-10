export default class CaseValidationError {
    private static readonly leadingErrorText = 'Case validation failed: ';
    private static readonly errorDelimiter = '., ';
    private static readonly fieldMessageDelimiter = ':';

    public readonly formattedIssues: string[];

    constructor(public readonly rowNumber: number, apiResponse: string) {
        const sortedErrorsByField = apiResponse
            .substr(CaseValidationError.leadingErrorText.length)
            .split(CaseValidationError.errorDelimiter)
            .map((str) => {
                const parts = str.split(
                    CaseValidationError.fieldMessageDelimiter,
                );
                return {
                    field: parts[0],
                    message: parts.slice(1).join().trim(),
                };
            })
            .sort((a, b) => {
                return a.field > b.field ? 1 : -1;
            });
        this.formattedIssues = sortedErrorsByField
            .filter(
                (a, index) =>
                    !sortedErrorsByField
                        .slice(index + 1)
                        .some((b) => b.field.includes(a.field)),
            )
            .map((tuple) => `${tuple.field}: ${tuple.message}`);
    }
}
