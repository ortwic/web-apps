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