export default class CaseValidationError {
    public readonly formattedIssues: string[];

    private readonly leadingErrorText = 'Case validation failed: ';
    private readonly errorDelimiter = '., ';
    private readonly fieldMessageDelimiter = ':';

    constructor(public readonly rowNumber: number, apiResponse: string) {
        const sortedErrorsByField = apiResponse
            .substr(this.leadingErrorText.length)
            .split(this.errorDelimiter)
            .map((str) => {
                const parts = str.split(this.fieldMessageDelimiter);
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
