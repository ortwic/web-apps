import { type Invalidator, type Readable, type Subscriber, type Unsubscriber, writable } from 'svelte/store';
import type { Firestore } from 'firebase/firestore';
import { collection, onSnapshot, doc, getDoc, writeBatch } from 'firebase/firestore';
import type { Entity } from '../models/schema.model';

// firestore does not like undefined values so omit them
const omitUndefinedFields = (data: Record<string, unknown>) => {
    Object.keys(data).forEach((key) => {
        if (data[key] === undefined) {
            delete data[key];
        }
    });
    return data;
};

const setDocOptions = {
    merge: true
};

export class DocumentStore<T extends Entity> implements Readable<T[]> {
    private readonly documents = writable<T[]>([]);
    readonly unsubscribe: () => void;

    constructor(private store: Firestore | null, private path: string) {
        if (store) {
            const reference = collection(store, this.path);
            this.unsubscribe = onSnapshot(reference, (snapshot) => {
                const docs = snapshot.docs.map((d) => (<T>{ id: d.id, ...d.data() }));
                this.documents.set(docs);
            });
        } else {
            this.unsubscribe = () => {};
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

            documents.forEach((data) => {
                const docRef = doc(this.store!, this.path, data.id);
                batch.set(docRef, omitUndefinedFields(data), setDocOptions);
            });

            await batch.commit();
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

