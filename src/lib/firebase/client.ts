

import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, inMemoryPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

export const getClientApp: () => FirebaseApp = () => {
    if (getApps().length) {
        return getApp();
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    setPersistence(auth, inMemoryPersistence);

    return app;
};
