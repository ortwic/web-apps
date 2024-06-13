import { getFirestore, collection, onSnapshot, type DocumentData, doc, setDoc, deleteDoc } from "firebase/firestore";
import { writable } from "svelte/store";
import { app } from "./auth.store";

// firestore does not like undefined values so omit them
const omitUndefinedFields = (data: Record<string, unknown>) => {
    Object.keys(data).forEach((key) => {
        if (data[key] === undefined) {
            delete data[key];
        }
    });
    return data;
};

type Data = {
    id: string;
} & DocumentData;

export function createStore<T extends Data>(path: string) {
    const firestore = getFirestore(app);
    const options = {
        merge: true
    };

    const documents = writable<Array<T>>([], set => {
        const items = collection(firestore, path);
        onSnapshot(items, snapshot => {
            const result = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as T))
            set(result);
        });
    });

    return {
        documents,
        async setDocument(data: T) {
            const docRef = doc(firestore, path, data.id);
            await setDoc(docRef, omitUndefinedFields(data), options);
        },
        async removeDocument(id: string) {
            const docRef = doc(firestore, path, id);
            await deleteDoc(docRef);
        }
    }
}
