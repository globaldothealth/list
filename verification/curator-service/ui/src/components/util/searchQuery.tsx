import { FilterFormValues } from '../FiltersModal';

export const searchQueryToURL = (searchQuery: string): string => {
    const searchParams = searchQuery.replace(/\s/g, '+');
    return searchParams === '' ? '' : 'q=' + searchParams;
};

export const filtersToURL = (filters: FilterFormValues): string => {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value) {
            const parsedValue = value.toString().includes(' ')
                ? `"${value}"`
                : value;
            searchParams.append(key, parsedValue);
        }
    }

    return searchParams.toString();
};

export const URLToSearchQuery = (url: string): string => {
    const isQuery = url.includes('?q=');

    if (!isQuery) {
        const searchParams = new URLSearchParams(url);
        let searchQuery = '';

        searchParams.forEach((value, key) => {
            searchQuery += `${key}:${value} `;
        });

        return searchQuery.trim();
    } else {
        return url.replace('?q=', '').replace(/[+]/g, ' ');
    }
};

export const URLToFilters = (url: string): FilterFormValues => {
    const isQuery = url.includes('?q=');

    if (isQuery) return {};

    const searchParams = new URLSearchParams(url);
    let filters: FilterFormValues = {};

    searchParams.forEach((value, key) => {
        const parsedValue = value.includes('"')
            ? value.replaceAll('"', '')
            : value;

        filters = {
            ...filters,
            [key]: parsedValue,
        };
    });

    return filters;
};
