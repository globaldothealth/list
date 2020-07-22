export default class CaseValidationError {
    private static readonly leadingErrorText = 'Case validation failed: ';
    private static readonly errorDelimiter = '., ';
    private static readonly fieldMessageDelimiter = ':';

    public readonly formattedIssues: string[];

    /**
     * Creates a CaseValidationError object based on provided data.
     *
     * The logic of interest is in the construction of formattedIssues. The
     * steps are as follows:
     *
     *   1. Remove leading boilerplate from the validation API response.
     *      TODO: Write an integration test that makes sure the boilerplate is
     *      up-to-date.
     *   2. Split the remaining response into discrete validation issues.
     *   3. Break each issue down to "{field}: {message}" constituents.
     *   4. Sort these by the field name, ascending.
     *   5. Filter all fields that are substrings of other fields. In other
     *      words, this filters down [{demographics: [...]}.
     *      {demographics.gender: [...]}] to only contain the dict corresponding
     *      to demographics.gender. Validation issues contain duplicate messages
     *      for nested fields -- this filtering removes these duplicates,
     *      leaving only issues keyed by the fully-qualified field name.
     *   6. Recombine field and message into an interface-friendly string.
     *
     * @param rowNumber The CSV row number of the case generating this error.
     * @param apiResponse The raw text response received from the validation API.
     */
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
