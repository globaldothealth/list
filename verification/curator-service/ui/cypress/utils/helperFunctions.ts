export function getDefaultQuery(limit = 50): string {
    return `/api/cases/?limit=${limit}&page=1&count_limit=10000&sort_by=confirmationDate&order=ascending`;
}
