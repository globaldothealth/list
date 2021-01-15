export const searchQueryToURL = (searchQuery: string): string => {
    const withFilters = searchQuery.includes(':');
    let searchParams;

    if (withFilters) {
        const filters = searchQuery.trim().match(/\w+:/g) ?? [];
        const params = searchQuery.trim().split(/\w+:/g).slice(1) ?? [];

        searchParams = new URLSearchParams();
        for (let i = 0; i < filters.length; i++) {
            searchParams.append(
                filters[i].replace(':', '').trim(),
                params[i].trim(),
            );
        }

        return searchParams.toString();
    } else {
        searchParams = searchQuery.replace(/\s/g, '+');
        return searchParams === '' ? '' : 'q=' + searchParams;
    }
};

export const URLToSearchQuery = (url: string): string => {
    const isQuery = url.includes('?q=');

    if (!isQuery) {
        const searchParams = new URLSearchParams(url);
        let searchQuery = '';

        searchParams.forEach((value, key) => {
            searchQuery += `${key}: ${value} `;
        });

        return searchQuery.trim();
    } else {
        return url.replace('?q=', '').replace(/[+]/g, ' ');
    }
};
