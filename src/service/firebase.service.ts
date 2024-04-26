import * as admin from "firebase-admin";
import { DocumentData } from "firebase-admin/firestore";
import { logger } from "./logger";

export function createFirestore() {
    admin.initializeApp({ 
        credential: admin.credential.cert({
            clientEmail: process.env.FIRE_CLIENT_EMAIL,
            privateKey: process.env.FIRE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            projectId: 'song-repo'
        })
    });

    const db = admin.firestore();
    const store = db.collection("events");

    return {
        setDocument: async (data: DocumentData) => {
            if (data.id) {
                try {
                    const docRef = store.doc(data.id);
                    return docRef.set(data);
                } catch (error) {
                    logger.error(error);            
                }
            } else {
                logger.error(`Unable to safe '${data.id}'!`);
            }
        }
    }
}
