import type { Readable } from 'svelte/store';
import type { Firestore, DocumentData } from 'firebase/firestore';
import { derived } from 'svelte/store';
import { getFirestore, collection, onSnapshot, doc, getDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { currentClientApp } from './firebase.store';
import type { EntityCollection } from '../models/schema.model';

// firestore does not like undefined values so omit them
const omitUndefinedFields = (data: Record<string, unknown>) => {
    Object.keys(data).forEach((key) => {
        if (data[key] === undefined) {
            delete data[key];
        }
    });
    return data;
};

const currentFirestore = derived(currentClientApp, (app) => app ? getFirestore(app) : null);
const setDocOptions = {
    merge: true
};

export type Entity = {
    id: string;
} & DocumentData;

export const createSchemaStore = () => createStore<EntityCollection>('__schema');
export function createStore<T extends Entity>(path: string) {
    type Store = ReturnType<typeof buildStore<T>>;
    return derived<Readable<Firestore | null>, Store>(currentFirestore, (store, set) =>
        set(buildStore(store, path))
    );
}

function buildStore<T extends Entity>(firestore: Firestore | null, path: string) {
    const documents = derived<Readable<Firestore | null>, T[]>(currentFirestore, (store, set) => {
        if (store) {
            const reference = collection(store, path);
            onSnapshot(reference, (snapshot) => {
                const docs = snapshot.docs.map(
                    (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data()
                        }) as T
                );
                set(docs);
            });
        }
        set([]);
    });

    async function getDocument(id: string): Promise<T | null> {
        if (firestore) {
            const docRef = doc(firestore, path, id);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return snapshot.data({ serverTimestamps: 'none' }) as T;
            }
        }
        return null;
    }

    async function setDocuments(...documents: T[]) {
        if (firestore && documents.length) {
            const batch = writeBatch(firestore);

            documents.forEach((data) => {
                const docRef = doc(firestore, path, data.id);
                batch.set(docRef, omitUndefinedFields(data), setDocOptions);
            });

            await batch.commit();
        }
    }

    async function removeDocuments(...ids: string[]) {
        if (firestore) {
            const batch = writeBatch(firestore);

            ids.forEach((id) => {
                const docRef = doc(firestore, path, id);
                batch.delete(docRef);                
            });

            await batch.commit();
        }
    }

    return {
        documents,
        getDocument,
        setDocuments,
        removeDocuments
    };
}

export function timestampReplacer(key: string, value: unknown) {
    if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        const ts = new Timestamp(Number(value.seconds), Number(value.nanoseconds));
        return ts.toDate().toISOString();
    }
    return value;
}
