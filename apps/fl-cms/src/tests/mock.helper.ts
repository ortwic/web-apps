import { get, writable } from "svelte/store";
import { of } from "rxjs";
import { merge } from "ts-deepmerge";
import type { DocumentStore } from "../lib/stores/db/document.service";
import type { Entity } from "../lib/models/schema.model";

const defaultOptions = { merge: true };

export const mockDocumentStore = <T extends Entity>(docs: T[], options = defaultOptions) => {
    const store = writable<T[]>([...docs]);
    return {
        options,
        subscribe: store.subscribe,
        getDocument: (id?: string) => of(get(store).find(d => d.id === id)),
        setDocuments: (...documents: T[]) => store.update(docs => (
            documents.map(newDoc => {
                const i = docs.findIndex(d => d.id === newDoc.id);
                if (options.merge) {
                    return <T>merge(docs[i] ?? {}, newDoc);
                }
                return newDoc;
            })
        )),
        removeDocuments: (ids: string[]) => store.update(d => d.filter(d => !ids.includes(d.id))),
        unsubscribe: () => {},
    } as unknown as DocumentStore<T>;
};
