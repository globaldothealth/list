// @ts-nocheck

interface GetDefaultQueryArgs {
    limit?: number;
    sortOrder?: string;
    query?: string;
}

export function getDefaultQuery(args: GetDefaultQueryArgs): string {
    const { limit, sortOrder, query } = args;

    const searchQuery = query ? `&q=${encodeURIComponent(query)}` : '';
    const queryLimit = limit ? limit : 50;
    const order = sortOrder ? sortOrder : 'descending';

    return `/api/cases/?limit=${queryLimit}&page=1&count_limit=10000&sort_by=confirmationDate&order=${order}${searchQuery}`;
}
