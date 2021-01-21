import { URLToSearchQuery, searchQueryToURL } from './searchQuery';

describe('Search query - string to url', () => {
    it('converts given string to url search parameters', () => {
        expect(searchQueryToURL('gender: male country: china')).toEqual(
            'gender=male&country=china',
        );
    });

    it('is able to convert filter values with spaces into valid url search params', () => {
        expect(searchQueryToURL('country: New Zealand')).toEqual(
            'country=New+Zealand',
        );
    });

    it('creates valid search query when no filters are added', () => {
        expect(searchQueryToURL('got infected at work - India')).toEqual(
            'q=got+infected+at+work+-+India',
        );
    });
});

describe('Search query - url to string', () => {
    it('converts url search parameters into normal string', () => {
        expect(URLToSearchQuery('?country=china&gender=female')).toEqual(
            'country:china gender:female',
        );
    });

    it('converts search query from url to normal string', () => {
        expect(URLToSearchQuery('?q=got+infected+at+work+-+India')).toEqual(
            'got infected at work - India',
        );
    });
});
