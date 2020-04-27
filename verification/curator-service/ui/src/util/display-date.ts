/**
 * Format provided {Date} for UI display.
 * 
 * We're using <tt>undefined</tt> to default to the user's browser for display
 * locale (e.g. day-month-year vs. month-day-year), but set the date timezone
 * to UTC.
 */
export default function displayDate(date: Date) {
    const options = { timeZone: 'UTC', timeZoneName: 'short' };
    return date.toLocaleDateString(undefined, options);
}