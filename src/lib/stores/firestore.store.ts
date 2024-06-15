import type { Readable } from 'svelte/store';
import type { Firestore, DocumentData } from 'firebase/firestore';
import { derived } from 'svelte/store';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { currentClientApp } from '$lib/stores/firebase.store';

// firestore does not like undefined values so omit them
const omitUndefinedFields = (data: Record<string, unknown>) => {
    Object.keys(data).forEach((key) => {
        if (data[key] === undefined) {
            delete data[key];
        }
    });
    return data;
};

const currentFirestore = derived(currentClientApp, (app) => getFirestore(app));
const setDocOptions = {
    merge: true
};

type Data = {
    id: string;
} & DocumentData;

type Store<T extends Data> = {
    documents: Readable<T[]>;
    setDocument: (data: T) => Promise<void>;
    removeDocument: (id: string) => Promise<void>;
};

export function createStore<T extends Data>(path: string) {
    return derived<Readable<Firestore>, Store<T>>(currentFirestore, (store, set) =>
        set(buildStore(store, path))
    );
}

function buildStore<T extends Data>(firestore: Firestore, path: string): Store<T> {
    const documents = derived<Readable<Firestore>, T[]>(currentFirestore, (store, set) => {
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
        set([]);
    });

    async function setDocument(data: T) {
        const docRef = doc(firestore, path, data.id);
        await setDoc(docRef, omitUndefinedFields(data), setDocOptions);
    }

    async function removeDocument(id: string) {
        const docRef = doc(firestore, path, id);
        await deleteDoc(docRef);
    }

    return {
        documents,
        setDocument,
        removeDocument
    };
}
