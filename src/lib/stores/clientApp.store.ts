import { derived, writable, type Readable } from 'svelte/store';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
// import { getAuth, inMemoryPersistence, setPersistence } from 'firebase/auth';

const DEFAULT_NAME = '[DEFAULT]';
type NamedFirebaseConfig = [FirebaseOptions, string?];

export const currentFirebaseConfig = writable<NamedFirebaseConfig>([
    {} as FirebaseOptions,
    DEFAULT_NAME
]);
export const currentClientApp = derived<Readable<NamedFirebaseConfig>, FirebaseApp>(
    currentFirebaseConfig,
    ([config, name], set) => set(getClientApp(config, name))
);

export function getClientApp(config: FirebaseOptions, name = DEFAULT_NAME): FirebaseApp {
    let app = getApps().find((app) => app.name === name);
    if (!app) {
        app = initializeApp(config, name);
        // const auth = getAuth(app);
        // setPersistence(auth, inMemoryPersistence);
    }
    return app;
}

export function setFirebaseConfig(config: FirebaseOptions, name: string) {
    currentFirebaseConfig.set([config, name]);
}
