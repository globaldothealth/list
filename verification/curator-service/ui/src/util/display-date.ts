export default function displayDate(date: Date) {
    return date.toLocaleDateString(undefined, { timeZone: 'UTC' });
}