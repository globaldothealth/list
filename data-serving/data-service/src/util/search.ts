import { parse, SearchParserResult } from 'search-query-parser';
import { resolveConfigFile } from 'prettier';

export interface ParsedSearch {
    fullTextSearch?: string;
    filters: {
        path: string;
        values: string[];
    }[];
}

// Map of keywords to their case data path.
// IMPORTANT: If you change this mapping, reflect the new keys in the openapi.yaml file as well.
const keywords = new Map<string, string>([
    ['curator', 'revisionMetadata.creationMetadata.curator'],
    ['gender', 'demographics.gender'],
    ['nationality', 'demographics.nationality'],
    ['occupation', 'demographics.occupation'],
    ['country', 'location.country'],
    ['outcome', 'outcome'],
    ['caseid', '_id'],
    ['uploadid', 'caseReference.uploadId'],
    ['source', 'caseReference.sourceUrl'],
    ['admin1', 'location.administrativeAreaLevel1'],
    ['admin2', 'location.administrativeAreaLevel2'],
    ['admin3', 'location.administrativeAreaLevel3'],
]);

export default function parseSearchQuery(q: string): ParsedSearch {
    q = q.trim();
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
    }
    return res;
}
