import type { DocumentData } from 'firebase/firestore';
import { writable } from 'svelte/store';
import { getFirestore, collection, onSnapshot, doc, getDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { app } from './firebase.setup';

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

export type Entity = {
    id: string;
} & DocumentData;

export function buildStore<T extends Entity>(path: string) {
    const firestore = getFirestore(app);
    const documents = writable<T[]>([], (set) => {
        const reference = collection(firestore, path);
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
