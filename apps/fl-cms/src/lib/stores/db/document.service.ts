import { type Invalidator, type Readable, type Subscriber, type Unsubscriber, writable } from 'svelte/store';
import type { CollectionReference, DocumentData, Firestore, QueryConstraint, SetOptions } from 'firebase/firestore';
import { collection, onSnapshot, doc, writeBatch, query } from 'firebase/firestore';
import { collectionData, docData } from 'rxfire/firestore';
import { of, type Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import type { Entity } from '../../models/schema.model';
import { showError, showWarn } from '../notification.store';

// firestore does not like undefined values so omit them
const omitUndefinedFields = (data: Record<string, unknown>) => {
    Object.keys(data).forEach((key) => {
        if (data[key] === undefined || data[key] === null) {
            delete data[key];
        } else if (typeof data[key] === 'object') {
            omitUndefinedFields(data[key] as Record<string, unknown>);
        }
    });
    return data;
};

const defaultSetOptions: SetOptions = {
    merge: true
};

export class DocumentStore<T extends Entity> implements Readable<T[]> {
    private readonly documents = writable<T[]>([]);
    readonly unsubscribe: () => void = () => {};

    constructor(private store: Firestore | null, 
        private path: string | undefined, 
        public options: SetOptions = defaultSetOptions
    ) {
        const pathValid = path && path.split('/').length % 2 > 0;
        if (!pathValid) {
            console.warn(`Invalid path: ${path}`);
        }

        if (store && pathValid) {
            const reference = collection(store, path);
            this.unsubscribe = onSnapshot(reference, (snapshot) => {
                const docs = snapshot.docs.map((d) => (<T>{ id: d.id, ...d.data() }));
                this.documents.set(docs);
            });
        } 
    }

    subscribe(run: Subscriber<T[]>, invalidate?: Invalidator<T[]> | undefined): Unsubscriber {
        return this.documents.subscribe(run, invalidate);
    }

    public getDocuments<T>(...constraints: QueryConstraint[]): Observable<T[]> {
        if (this.store && this.path) {
            const items = collection(this.store, this.path) as CollectionReference<T>;
            const q = query<T, DocumentData>(items, ...constraints);
            return collectionData<T>(q, this.options).pipe(startWith([]));
        }
        return of([]);
    }
    
    public getDocument(id?: string): Observable<T | null> {
        if (id && this.store && this.path) {
            const docRef = doc(this.store, this.path, id);
            return docData(docRef, { idField: 'id' });
        }
        return of(null);
    }

    async setDocuments(...documents: T[]) {
        if (this.store && this.path && documents.length) {
            const batch = writeBatch(this.store);

            const commitedData = documents.map((data) => {
                const dataWithoutNullValues = omitUndefinedFields(data);
                const docRef = doc(this.store!, this.path, data.id);
                batch.set(docRef, dataWithoutNullValues, this.options);
                return dataWithoutNullValues;
            });

            try {            
                await batch.commit();
            } catch (error: any) {
                console.error(error);
                console.debug(commitedData);
                showError(error.message);                
            }
        }
    }

    async removeDocuments(...ids: string[]) {
        if (this.store && this.path) {
            const batch = writeBatch(this.store);

            ids.forEach((id) => {
                const docRef = doc(this.store!, this.path, id);
                batch.delete(docRef);                
            });

            await batch.commit();
        }
    }
}

