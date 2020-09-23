import { SearchParserResult, parse } from 'search-query-parser';

export interface ParsedSearch {
    fullTextSearch?: string;
    filters: {
        path: string;
        values: string[];
    }[];
}

/** Parsing error is thrown upon invalid search query. */
export class ParsingError extends Error {}

// Map of keywords to their case data path.
// IMPORTANT: If you change this mapping, reflect the new keys in the openapi.yaml file as well.
const keywords = new Map<string, string>([
    ['curator', 'revisionMetadata.creationMetadata.curator'],
    ['gender', 'demographics.gender'],
    ['nationality', 'demographics.nationalities'],
    ['occupation', 'demographics.occupation'],
    ['country', 'location.country'],
    ['outcome', 'outcome'],
    ['caseid', '_id'],
    ['uploadid', 'caseReference.uploadIds'],
    ['sourceurl', 'caseReference.sourceUrl'],
    ['verificationstatus', 'caseReference.verificationStatus'],
    ['admin1', 'location.administrativeAreaLevel1'],
    ['admin2', 'location.administrativeAreaLevel2'],
    ['admin3', 'location.administrativeAreaLevel3'],
]);

export default function parseSearchQuery(q: string): ParsedSearch {
    q = q.trim();
    // parse() doesn't handle most-likely mistyped queries like
    // "curator: foo@bar.com" (with a space after the semicolon).
    // Change the query here to account for that: this regexp removes all
    // whitespace after semicolons so that
    // "curator: foo@bar.com" becomes "curator:foo@bar.com".
    q = q.replace(/(\w:)(\s+)/g, '$1');
    const parsedSearch = parse(q, {
        offsets: false,
        keywords: [...keywords.keys()],
        alwaysArray: true,
    });
    const res: ParsedSearch = {
        filters: [],
    };
    // When no tokens are specified or found, the returned value is a string.
    if (typeof parsedSearch === 'string') {
        res.fullTextSearch = parsedSearch as string;
    } else {
        // When tokens are found, searchResult is a struct with tokens as properties
        // and full text search is contained in the "text" property.
        const searchParsedResult = parsedSearch as SearchParserResult;
        // We don't tokenize so "text" is a string, not an array of strings.
        res.fullTextSearch = searchParsedResult.text as string;

        // Get the keywords into our result struct.
        keywords.forEach((path, keyword): void => {
            if (!searchParsedResult[keyword]) {
                return;
            }
            res.filters.push({
                path: path,
                values: searchParsedResult[keyword],
            });
        });
        if (res.filters.length === 0 && !res.fullTextSearch) {
            throw new ParsingError(`Invalid search query ${q}`);
        }
    }
    return res;
}
