import { derived } from 'svelte/store';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
import { currentFirebaseConfig } from '$lib/stores/appSettings.store';
// import { getAuth, inMemoryPersistence, setPersistence } from 'firebase/auth';

export const currentClientApp = derived(currentFirebaseConfig, (config) => getClientApp(config, config.projectId));

export function getClientApp(config: FirebaseOptions, name = '[DEFAULT]'): FirebaseApp {
    let app = getApps().find((app) => app.name === name);
    if (!app) {
        app = initializeApp(config, name);
        // const auth = getAuth(app);
        // setPersistence(auth, inMemoryPersistence);
    }
    return app;
}
