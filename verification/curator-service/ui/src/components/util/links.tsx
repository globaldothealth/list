/**
 * Prepare raw link strings for use in <a> href values.
 */
export default function createHref(rawLink: string): string {
    // Don't modify relative links.
    if (rawLink.startsWith('/')) return rawLink;
    return rawLink.match(/^https?:\/\//) ? rawLink : 'https://'.concat(rawLink);
}
