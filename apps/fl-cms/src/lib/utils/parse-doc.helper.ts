import yaml from 'js-yaml';

type ParseResult<T> = { doc: T[], warnings?: string[], error?: Error };
type WithId = { id?: string; name?: string };

const REPLACE_MAP: Record<string, string> = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue',
    'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue',
    'ß': 'ss',
};

const REPLACE_PATTERN = new RegExp(Object.keys(REPLACE_MAP).join('|'), 'g');
const NON_WORD_CHARS = /[^\w]+/g;
const TRAILING_HYPHENS = /^-+|-+$/g;

function generateIdFromFieldValues<T>(name: T[]): string {
    return name.join('_')
        .replace(REPLACE_PATTERN, char => REPLACE_MAP[char])
        .toLowerCase()
        .replace(NON_WORD_CHARS, '-')
        .replace(TRAILING_HYPHENS, '');
}

function validateIds<T extends WithId>(entries: T[], idFromKey: Array<keyof T>): string[] {
    const warnings: string[] = [];
    const seenIds = new Set<string>();
    const duplicateIds = new Set<string>();
    const missingIdIndices: number[] = [];

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (!entry.id) {
            if (idFromKey.every(key => entry[key])) {
                const generatedId = generateIdFromFieldValues(idFromKey.map(key => entry[key]));
                if (seenIds.has(generatedId)) {
                    duplicateIds.add(generatedId);
                } else {
                    entry.id = generatedId;
                    seenIds.add(generatedId);
                }
            } else {
                missingIdIndices.push(i);
            }
            continue;
        }

        if (seenIds.has(entry.id)) {
            duplicateIds.add(entry.id);
        } else {
            seenIds.add(entry.id);
        }
    }

    if (missingIdIndices.length > 0) {
        warnings.push(`Missing id (and no ${idFromKey.toString()}) at entries: ${missingIdIndices.join(', ')}`);
    }
    if (duplicateIds.size > 0) {
        warnings.push(`Duplicate ids found: ${[...duplicateIds].join(', ')}`);
    }

    return warnings;
}

export function parseDocument<T extends WithId>(content: string, filename: string, idFromKey: Array<keyof T>): ParseResult<T> {
    try {
        const doc = yaml.load(content, { filename }) as T[];
        const warnings = validateIds(doc, idFromKey);
        return warnings.length > 0 ? { doc, warnings } : { doc };
    } catch (error) {
        return { doc: [], error: error as Error };
    }
}