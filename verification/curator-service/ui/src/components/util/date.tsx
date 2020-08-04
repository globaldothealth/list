export default function renderDate(date: string | Date | null): string {
    if (!date) return '';
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return `${date.getUTCFullYear()}-${
        date.getUTCMonth() + 1
    }-${date.getUTCDate()}`;
}
