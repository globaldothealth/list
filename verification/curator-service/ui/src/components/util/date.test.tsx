import renderDate, { renderDateRange } from './date';

describe('Dates', () => {
    it('are padded', () => {
        expect(renderDate(new Date(Date.UTC(2020, 6, 9)))).toEqual(
            '2020-07-09',
        );
    });
});

describe('Date ranges', () => {
    it('are shown as one date if start and end are identical', () => {
        expect(
            renderDateRange({
                start: new Date(Date.UTC(2020, 5, 7)).toString(),
                end: new Date(Date.UTC(2020, 5, 7)).toString(),
            }),
        ).toEqual('2020-06-07');
    });

    it('are shown as range if start and end are different', () => {
        expect(
            renderDateRange({
                start: new Date(Date.UTC(2020, 5, 7)).toString(),
                end: new Date(Date.UTC(2020, 10, 17)).toString(),
            }),
        ).toEqual('2020-06-07 - 2020-11-17');
    });
});
