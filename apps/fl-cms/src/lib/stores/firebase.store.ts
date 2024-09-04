import { derived, writable } from 'svelte/store';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
import { currentFirebaseConfig } from './settings.store';
import { getAuth, type User } from 'firebase/auth';

export const currentClientApp = derived(currentFirebaseConfig, getClientApp);
export const currentClientAuth = derived(currentClientApp, (app) => app ? getAuth(app) : null);
export const currentClientUser = writable<User | null>(null);

function getClientApp(config: FirebaseOptions): FirebaseApp | null {
    if (config) {
        const name = config.projectId ?? '[DEFAULT]';
        return getApps().find((app) => app.name === name) ?? initializeApp(config, name);
    }
    return null;
}
