import json from 'json5';
import { showWarn } from '../stores/notification.store';

export function confirmed(event: Event) {
    if (event instanceof KeyboardEvent) {
        return event.key === undefined || event.key.toLowerCase() === 'enter';
    }
}

export function isUnique<T extends { type: string }>(array: T[], section: T) {
    if (array.contains(section)) {
        showWarn(`Section of '${section.type}' already exists. Edit existing section to add a new one!`);
        return false;
    }
    return true;
}

export function withKey<T>(array: T[], keyField = 'key') {
    const key = (item: T) => json.stringify(item);
    return array.map((item) => ({ item, [keyField]: key(item) }));
}

export function debounce(func: (...args: any[]) => any, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
