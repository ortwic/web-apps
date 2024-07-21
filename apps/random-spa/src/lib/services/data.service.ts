import { derived } from "svelte/store";
import { buildStore } from "./firestore.builder";
import { lang } from "./i18n";

interface Data {
    id: string;
    level: string;
    level_de: string;
    content: string;
    content_de: string;
    tags: string[];
    group: string;
}

const store = buildStore<Data>('data');

export function getGroups() {
    return derived(store.documents, docs => {
        return docs.reduce((acc, doc) => {
            if (!acc.includes(doc.group)) {
                acc.push(doc.group);
            }
            return acc;
        }, [] as string[]);
    });
}

export function getLevels(group: string) {
    function sumLevels(acc: string[], data: Data) {
        if (!acc.includes(data.level)) {
            acc.push(data.level);
        }
        return acc;
    }

    return derived(store.documents, docs => {
        return docs.filter(d => d.group === group)
            .reduce(sumLevels, [] as string[]);
    });
}

export function getRandomEntry(group: string, level: string) {
    return derived(store.documents, docs => {
        return docs
            .filter(d => d.group === group)
            .filter(d => d.level === level)
            .sort(() => Math.random() - 0.5)
            .map(translateData)[0];
    });
}

function translateData(data: Data) {
    return {
        tags: data.tags,
        group: data.group,
        content: lang === 'de' && data.content_de ? data.content_de : data.content,
        level: lang === 'de' && data.level_de  ? data.level_de : data.level
    };
}
