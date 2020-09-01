import renderDate from './date';

describe('Dates', () => {
    it('are padded', () => {
        expect(renderDate(new Date(Date.UTC(2020, 6, 9)))).toEqual(
            '2020-07-09',
        );
    });
});
