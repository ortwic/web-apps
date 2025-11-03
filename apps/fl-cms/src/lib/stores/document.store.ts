import { type Invalidator, type Readable, type Subscriber, type Unsubscriber, writable } from 'svelte/store';
import type { Firestore, SetOptions } from 'firebase/firestore';
import { collection, onSnapshot, doc, getDoc, writeBatch } from 'firebase/firestore';
import type { Entity } from '../models/schema.model';
import { showError, showWarn } from './notification.store';

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
        private path: string, 
        public options: SetOptions = defaultSetOptions
    ) {
        const pathValid = path.split('/').length % 2 > 0;
        if (!pathValid) {
            showWarn(`Invalid path ${path}`);
        }

        if (store && pathValid) {
            const reference = collection(store, this.path);
            this.unsubscribe = onSnapshot(reference, (snapshot) => {
                const docs = snapshot.docs.map((d) => (<T>{ id: d.id, ...d.data() }));
                this.documents.set(docs);
            });
        } 
    }

    subscribe(run: Subscriber<T[]>, invalidate?: Invalidator<T[]> | undefined): Unsubscriber {
        return this.documents.subscribe(run, invalidate);
    }

    async getDocument(id?: string): Promise<T | null> {
        if (id && this.store) {
            const docRef = doc(this.store, this.path, id);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return {
                    id,
                    ...snapshot.data({ serverTimestamps: 'none' })
                } as T;
            }
        }
        return null;
    }

    async setDocuments(...documents: T[]) {
        if (this.store && documents.length) {
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
        if (this.store) {
            const batch = writeBatch(this.store);

            ids.forEach((id) => {
                const docRef = doc(this.store!, this.path, id);
                batch.delete(docRef);                
            });

            await batch.commit();
        }
    }
}

