/**
 * normalize path: remove duplicate slashes and trim
 * @param path 
 * @returns 
 */
export const normalizePath = (path?: string) => path?.replace(/\/+/g, '/').trim();
export const trimSlashes = (path?: string) => path?.replace(/^\/|\/$/g, '').trim();

export function isRelativeUrl(url?: string | null): boolean {
    return typeof url === 'string' && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:') || false;
}

export function getInitials(text: string, maxLength = 2) {
    const segments = text.split(/\W|_/);
    if (segments.length > 1) {
        return segments.map(s => s[0]).join('')
            .substring(0, maxLength)
            .toUpperCase();
    }
    if (text.length > 1) {
        return text.substring(0, maxLength).toUpperCase();
    }
    return text;
}