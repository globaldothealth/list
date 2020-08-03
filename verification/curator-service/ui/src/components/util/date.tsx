export default function renderDate(date: string | Date | null): string {
    if (!date) return '';
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
