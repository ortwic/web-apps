import * as admin from "firebase-admin";
import { DocumentData } from "firebase-admin/firestore";
import { logger } from "./logger";

export function createFirestoreService(clientEmail: string) {
    admin.initializeApp({ 
        credential: admin.credential.cert({
            clientEmail,
            privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
            projectId: 'song-repo'
        })
    });

    const db = admin.firestore();
    const store = db.collection("events");

    return {
        getDocuments: async () => {
            const snapshot = await store.get();
            return snapshot.docs.map(doc => doc.data())
                .filter(e => e.creator?.email === clientEmail);
        },
        setDocument: async (id: string, data: DocumentData) => {
            if (id) {
                try {
                    const docRef = store.doc(id);
                    return docRef.set(data, { merge: true });
                } catch (error: any) {
                    logger.error(error?.message ?? error);            
                }
            } else {
                logger.error(`Unable to safe '${id}'!`);
            }
        },
        removeDocument: async (id: string) => {
            if (id) {
                try {
                    const docRef = store.doc(id);
                    return docRef.delete();
                } catch (error: any) {
                    logger.error(error?.message ?? error);            
                }
            } else {
                logger.error(`Unable to remove '${id}'!`);
            }
        }
    }
}
