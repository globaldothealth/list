import {
    URLToSearchQuery,
    searchQueryToURL,
    filtersToURL,
    URLToFilters,
} from './searchQuery';
import { FilterFormValues } from '../FiltersModal';

describe('Search query - string to url', () => {
    it('converts given string to url search parameters', () => {
        expect(searchQueryToURL('Got infected at work - India')).toEqual(
            'q=Got+infected+at+work+-+India',
        );
    });

    it('converts filter keywords - values object to url search parameters', () => {
        const testFilters: FilterFormValues = {
            country: 'France',
            gender: 'Female',
            outcome: 'Recovered',
        };
        expect(filtersToURL(testFilters)).toEqual(
            'country=France&gender=Female&outcome=Recovered',
        );
    });

    it('is able to convert filter values with spaces into valid url search params', () => {
        const testFilters: FilterFormValues = {
            country: 'United States',
        };

        expect(filtersToURL(testFilters)).toEqual(
            'country=%22United+States%22',
        );
    });
});

describe('Search query - url to string', () => {
    it('converts url search parameters into filters', () => {
        expect(URLToSearchQuery('?country=china&gender=female')).toEqual(
            'country:china gender:female',
        );
    });

    it('converts url search parameters to search query', () => {
        expect(URLToSearchQuery('?q=got+infected+at+work+-+India')).toEqual(
            'got infected at work - India',
        );
    });

    it('converts url search parameters to filters object', () => {
        const testResponse: FilterFormValues = {
            country: 'France',
            gender: 'Female',
        };

        expect(URLToFilters('?country=France&gender=Female')).toEqual(
            testResponse,
        );
    });
});
