export type IDateFilter = {
    numDaysBeforeToday: number;
    op: 'EQ' | 'LT' | 'GT';
};
