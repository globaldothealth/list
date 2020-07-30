import parseSearchQuery from '../../src/util/search';

describe('search query', () => {
    it('is parsed with full text search', () => {
        const res = parseSearchQuery('some query');
        expect(res).toEqual({ fullTextSearch: 'some query' });
    });

    it('is parsed with empty query', () => {
        const res = parseSearchQuery('');
        expect(res).toEqual({ fullTextSearch: '' });
    });

    it('is parsed with negative searches', () => {
        const res = parseSearchQuery('want -nogood');
        expect(res).toEqual({ fullTextSearch: 'want -nogood' });
    });
});
