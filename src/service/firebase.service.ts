import * as admin from "firebase-admin";
import { DocumentData } from "firebase-admin/firestore";
import { logger } from "./logger";

export function createFirestoreService() {
    admin.initializeApp({ 
        credential: admin.credential.cert({
            clientEmail: process.env.CLIENT_EMAIL,
            privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
            projectId: 'song-repo'
        })
    });

    const db = admin.firestore();
    const store = db.collection("events");

    return {
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
        }
    }
}
