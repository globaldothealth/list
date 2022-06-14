const urlMap: { [idx: string]: { [idx: string]: string } } = {
    'covid-19': {
        local: 'http://localhost:3002',
        dev: 'https://dev-data.covid-19.global.health',
        qa: 'https://qa-data.covid-19.global.health',
        prod: 'https://data.covid-19.global.health',
    },
};

export function baseURL(disease: string, environment: string): string {
    return urlMap[disease]?.[environment] ?? 'http://localhost:3002';
}
