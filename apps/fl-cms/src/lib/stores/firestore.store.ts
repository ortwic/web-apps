import type { Readable } from 'svelte/store';
import type { Firestore, SetOptions } from 'firebase/firestore';
import { derived } from 'svelte/store';
import { Timestamp } from 'firebase/firestore';
import { appStore } from './app.store';
import { DocumentStore } from './document.store';
import { SchemaStore } from './schema.store';
import type { Collection, Entity } from '../models/schema.model';

export const currentFirestore = derived(appStore, (app) => app.getFirestore());

export function createSchemaStore(options?: SetOptions) {
    return derived<Readable<Firestore | null>, SchemaStore>(currentFirestore, (store, set) =>
        set(new SchemaStore(new DocumentStore<Collection>(store, '__schema', options)))
    );
}

export function createDocumentStore<T extends Entity>(path?: string, options?: SetOptions) {
    return derived<Readable<Firestore | null>, DocumentStore<T>>(currentFirestore, (store, set) =>
        set(new DocumentStore(store, path, options))
    );
}

export function timestampReplacer(key: string, value: unknown) {
    if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        const ts = new Timestamp(Number(value.seconds), Number(value.nanoseconds));
        return ts.toDate().toISOString();
    }
    return value;
}
