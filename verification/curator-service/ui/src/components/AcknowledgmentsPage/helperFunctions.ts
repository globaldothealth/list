import { Data } from './types';

export function descendingComparator<T>(a: T, b: T, orderBy: keyof T): number {
    const aItem =
        typeof a[orderBy] === 'string' ? a[orderBy].toUpperCase() : a[orderBy];
    const bItem =
        typeof b[orderBy] === 'string' ? b[orderBy].toUpperCase() : b[orderBy];

    if (bItem < aItem) {
        return -1;
    }
    if (bItem > aItem) {
        return 1;
    }
    return 0;
}

type Order = 'asc' | 'desc';

export function getComparator<Key extends keyof Data>(
    order: Order,
    orderBy: Key,
): (
    a: { [key in Key]: number | string },
    b: { [key in Key]: number | string },
) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

// eslint-disable-next-line
export function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

export function createData(
    _id: string,
    providerName: string,
    dataSource: string,
    license: string,
): Data {
    return { _id, providerName, dataSource, license };
}
