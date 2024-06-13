import { readable } from "svelte/store";
import { type User, onAuthStateChanged, getAuth } from "firebase/auth";
import { getClientApp } from "$lib/firebase/client";

export const app = getClientApp();
export const auth = getAuth(app);

// https://www.captaincodeman.com/how-to-await-firebase-auth-with-sveltekit
export const user = readable<User | null>(
    auth.currentUser ?? null, 
    (set) => onAuthStateChanged(auth, set)
);