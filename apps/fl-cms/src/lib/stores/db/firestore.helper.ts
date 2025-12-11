import type { Readable } from 'svelte/store';
import type { Firestore, SetOptions } from 'firebase/firestore';
import { derived } from 'svelte/store';
import { Timestamp } from 'firebase/firestore';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { appStore } from '../app.store';
import { DocumentStore } from './document.service';
import { SchemaStore } from './schema.service';
import type { Collection, Entity } from '../../models/schema.type';
import { fromStore } from '../../utils/rx.store';

export const SCHEMA_DEFAULT_NAME = '__schema';

export const currentFirestore = derived(appStore, (app) => app.getFirestore());

export function createSchemaStore(name = SCHEMA_DEFAULT_NAME): Readable<SchemaStore> {
    return derived<Readable<Firestore | null>, SchemaStore>(currentFirestore, (store, set) =>
        set(new SchemaStore(new DocumentStore<Collection>(store, name)))
    );
}

export function createDocumentStore<T extends Entity>(path: Observable<string | undefined> | string | undefined): Observable<DocumentStore<T>> {
    const path$ = path instanceof Observable ? path : of(path);
    return combineLatest([fromStore(currentFirestore), path$]).pipe(
        map(([store, path]) => new DocumentStore<T>(store, path))
    );
}

export function timestampToIsoDate<T>(value: T): string | T {
    if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        const ts = new Timestamp(Number(value.seconds), Number(value.nanoseconds));
        return ts.toDate().toISOString();
    }
    return value;
}
