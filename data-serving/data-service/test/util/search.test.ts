import parseSearchQuery from '../../src/util/search';

describe('search query', () => {
    it('is parsed with full text search', () => {
        const res = parseSearchQuery('some query');
        expect(res).toEqual({ fullTextSearch: 'some query', filters: [] });
    });

    it('is parsed with empty query', () => {
        const res = parseSearchQuery('');
        expect(res).toEqual({ fullTextSearch: '', filters: [] });
    });

    it('is parsed with negative searches', () => {
        const res = parseSearchQuery('want -nogood');
        expect(res).toEqual({ fullTextSearch: 'want -nogood', filters: [] });
    });

    it('is parses tokens', () => {
        const res = parseSearchQuery(
            'curator:foo@bar.com,baz@meh.com gender:male nationality:swiss occupation:"clock maker" country:switzerland outcome:recovered caseid:abc123 uploadid:def456 source:wsj.com admin1:"some admin 1" admin2:"some admin 2" admin3:"some admin 3"',
        );
        expect(res).toEqual({
            filters: [
                {
                    path: 'revisionMetadata.creationMetadata.curator',
                    values: ['foo@bar.com', 'baz@meh.com'],
                },
                {
                    path: 'demographics.gender',
                    values: ['male'],
                },
                {
                    path: 'demographics.nationality',
                    values: ['swiss'],
                },
                {
                    path: 'demographics.occupation',
                    values: ['clock maker'],
                },
                {
                    path: 'location.country',
                    values: ['switzerland'],
                },
                {
                    path: 'outcome',
                    values: ['recovered'],
                },
                {
                    path: '_id',
                    values: ['abc123'],
                },
                {
                    path: 'caseReference.uploadId',
                    values: ['def456'],
                },
                {
                    path: 'caseReference.sourceUrl',
                    values: ['wsj.com'],
                },
                {
                    path: 'location.administrativeAreaLevel1',
                    values: ['some admin 1'],
                },
                {
                    path: 'location.administrativeAreaLevel2',
                    values: ['some admin 2'],
                },
                {
                    path: 'location.administrativeAreaLevel3',
                    values: ['some admin 3'],
                },
            ],
        });
    });

    it('ignores unknown keywords', () => {
        const res = parseSearchQuery('something:else');
        expect(res).toEqual({ fullTextSearch: 'something:else', filters: [] });
    });
});
