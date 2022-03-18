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
    prod: 'https://map.covid-19.global.health/',
    local: 'http://dev-map.covid-19.global.health/',
    locale2e: 'http://dev-map.covid-19.global.health/',
    dev: 'http://dev-map.covid-19.global.health/',
};
