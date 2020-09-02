import { DateFilter } from '../../src/model/date-filter';
import fullModel from './data/date-filter.full.json';

describe('DateFilter schema', () => {
    it('should build a valid date filter', () => {
        const errors = new DateFilter(fullModel).validateSync();
        expect(errors).toBeUndefined();
    });
    it('should not include an _id field', () => {
        const df = new DateFilter(fullModel);
        expect(df['_id']).toBeUndefined();
    });
});
