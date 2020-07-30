import { parse, SearchParserResult } from 'search-query-parser';

export interface ParsedSearch {
    fullTextSearch?: string;
}

export default function parseSearchQuery(q: string): ParsedSearch {
    q = q.trim();
    const parsedSearch = parse(q, {
        offsets: false,
        // TODO: Specify tokens here.
    });
    const res: ParsedSearch = {};
    // When no tokens are specified or found, the returned value is a string.
    if (typeof parsedSearch === 'string') {
        res.fullTextSearch = parsedSearch as string;
    } else {
        // When tokens are found, searchResult is a struct with tokens as properties
        // and full text search is contained in the "text" property.
        const searchParsedResult = parsedSearch as SearchParserResult;
        // We don't tokenize so "text" is a string, not an array of strings.
        res.fullTextSearch = searchParsedResult.text as string;
    }
    return res;
}
