import type { Readable } from 'svelte/store';
import type { Firestore, SetOptions } from 'firebase/firestore';
import { derived } from 'svelte/store';
import { Timestamp } from 'firebase/firestore';
import { combineLatest, Observable, switchMap } from 'rxjs';
import { appStore } from '../app.store';
import { DocumentStore } from './document.service';
import { SchemaStore } from './schema.service';
import type { Collection, Entity } from '../../models/schema.model';
import { fromStore } from '../../utils/rx.store';
import type { Content } from '../../models/content.type';

export const currentFirestore = derived(appStore, (app) => app.getFirestore());

export function createSchemaStore(options?: SetOptions): Readable<SchemaStore> {
    return derived<Readable<Firestore | null>, SchemaStore>(currentFirestore, (store, set) =>
        set(new SchemaStore(new DocumentStore<Collection>(store, '__schema', options)))
    );
}

export function getCurrentScheme(path: Readable<string | undefined>): Observable<Collection | null> {
    return combineLatest([
        fromStore(createSchemaStore()), 
        fromStore(path)
    ]).pipe(switchMap(([store, path]) => store.getCollection(path)));
}

export function getContentStore(path?: string, options?: SetOptions) {
    return derived<Readable<Firestore | null>, DocumentStore<Content>>(currentFirestore, (store, set) =>
        set(new DocumentStore(store, path, options))
    );
}

export function createDocumentStore<T extends Entity>(path?: string, options?: SetOptions) {
    return derived<Readable<Firestore | null>, DocumentStore<T>>(currentFirestore, (store, set) =>
        set(new DocumentStore(store, path, options))
    );
}

export function timestampToIsoDate<T>(value: T): string | T {
    if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        const ts = new Timestamp(Number(value.seconds), Number(value.nanoseconds));
        return ts.toDate().toISOString();
    }
    return value;
}
