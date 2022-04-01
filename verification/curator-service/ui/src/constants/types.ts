export enum SortBy {
    Default = 'default',
    ConfirmationDate = 'confirmationDate',
    Country = 'country',
    Admin1 = 'admin1',
    Admin2 = 'admin2',
    Admin3 = 'admin3',
    Age = 'age',
}

export enum SortByOrder {
    Ascending = 'ascending',
    Descending = 'descending',
}

interface IMapLink {
    [id: string]: string;
}

// Link to the map application based on current env
export const MapLink: IMapLink = {
    local: 'http://eu-dev-map.covid-19.global.health/',
    locale2e: 'http://eu-dev-map.covid-19.global.health/',
    dev: 'http://eu-dev-map.covid-19.global.health/',
    qa: 'http://qa-map.covid-19.global.health',
    prod: 'https://map.covid-19.global.health/',
};
