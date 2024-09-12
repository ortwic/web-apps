import type { Readable } from 'svelte/store';
import { derived, writable, } from 'svelte/store';
import type { Firestore } from 'firebase/firestore';
import { collection, onSnapshot, doc, getDoc, Timestamp, writeBatch } from 'firebase/firestore';
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

    constructor(private store: Firestore | null, private path: string) {
        if (store) {
            const reference = collection(store, this.path);
            onSnapshot(reference, (snapshot) => {
                const docs = snapshot.docs.map(
                    (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data()
                        }) as T
                );
                this.documents.set(docs);
            });
        }
    }

    subscribe = derived(this.documents, this.pipe).subscribe;

    protected pipe(documents: T[]) {
        return documents;
    }

    async getDocument(id: string): Promise<T | null> {
        if (this.store) {
            const docRef = doc(this.store, this.path, id);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return snapshot.data({ serverTimestamps: 'none' }) as T;
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

export function timestampReplacer(key: string, value: unknown) {
    if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        const ts = new Timestamp(Number(value.seconds), Number(value.nanoseconds));
        return ts.toDate().toISOString();
    }
    return value;
}
