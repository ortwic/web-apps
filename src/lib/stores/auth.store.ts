import { readable } from 'svelte/store';
import { type User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { getClientApp } from '$lib/stores/clientApp.store';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

const app = getClientApp(firebaseConfig);
export const auth = getAuth(app);

// https://www.captaincodeman.com/how-to-await-firebase-auth-with-sveltekit
export const user = readable<User | null>(auth.currentUser ?? null, (set) =>
    onAuthStateChanged(auth, set)
);
