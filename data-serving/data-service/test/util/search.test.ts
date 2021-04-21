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

    it('errors if no value given for keyword', () => {
        expect(() => parseSearchQuery('country:')).toThrow(/country/);
    });

    it('consolidates keywords in query', () => {
        const res = parseSearchQuery('country: other gender:   Female');
        expect(res).toEqual({
            filters: [
                {
                    path: 'demographics.gender',
                    values: ['Female'],
                },
                {
                    path: 'location.country',
                    values: ['other'],
                },
            ],
        });
    });

    it('is parses tokens', () => {
        const res = parseSearchQuery(
            'curator:foo@bar.com,baz@meh.com gender:male nationality:swiss ' +
                'occupation:"clock maker" country:switzerland outcome:recovered ' +
                'caseid:abc123 uploadid:def456 sourceurl:wsj.com  verificationstatus:verified ' +
                'admin1:"some admin 1" admin2:"some admin 2" admin3:"some admin 3"' +
                'variant:"B.1.351"',
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
                    path: 'demographics.nationalities',
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
                    path: 'events.value',
                    values: ['recovered'],
                },
                {
                    path: '_id',
                    values: ['abc123'],
                },
                {
                    path: 'caseReference.uploadIds',
                    values: ['def456'],
                },
                {
                    path: 'caseReference.sourceUrl',
                    values: ['wsj.com'],
                },
                {
                    path: 'caseReference.verificationStatus',
                    values: ['verified'],
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
                {
                    path: 'variant.name',
                    values: ['B.1.351'],
                },
            ],
        });
    });

    it('ignores unknown keywords', () => {
        const res = parseSearchQuery('something:else');
        expect(res).toEqual({ fullTextSearch: 'something:else', filters: [] });
    });
});
