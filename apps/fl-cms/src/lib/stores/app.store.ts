import { derived, writable } from "svelte/store";
import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import type { Auth, User, UserCredential } from "firebase/auth";
import { connectAuthEmulator, EmailAuthProvider, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut } from "firebase/auth";
import { Firestore, connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { showError, showInfo, showWarn } from "./notification.store";
import type { AppSettings } from "./settings.type";
import { EMULATOR_KEY, settingsStore } from "./settings.store";

export const appStore = derived(settingsStore, (settings) => new FirebaseAppAdapter(settings));
export const currentClientUser = writable<User | null>(null);

const currentStores = new WeakSet<Firestore>();
const currentStorages = new WeakSet<FirebaseStorage>();
const currentAuths = new WeakSet<Auth>();
const userForEmulator = {
    email: `john.doe@example.com`,
    password: 'password',
    displayName: `John Doe`
} as const;

class FirebaseAppAdapter {
    private app: FirebaseApp | null;
    private config: FirebaseOptions;
    private editRole: string | undefined;
    readonly useEmulator: boolean;

    constructor(settings: AppSettings) {
        const { customEditRole, ...config } = settings.firebaseConfigs[settings.selectedProjectId] || {};
        this.config = config;
        this.useEmulator = settings.selectedProjectId === EMULATOR_KEY;
        this.editRole = !this.useEmulator ? customEditRole : undefined;
        this.app = this.getClientApp(this.config);
    }

    get validConfig(): boolean {
        return this.config && 'apiKey' in this.config && 'authDomain' in this.config && 'projectId' in this.config;
    }

    private getClientApp(config: FirebaseOptions): FirebaseApp | null {
        if (config) {
            const name = config.projectId ?? '[DEFAULT]';
            return getApps().find((app) => app.name === name) ?? initializeApp(config, name);
        }
        return null;
    }

    getFirestore(): Firestore | null {
        if (this.app) {
            const store = getFirestore(this.app);
            if (this.useEmulator && this.config.databaseURL && !currentStores.has(store)) {
                this.emulateFirestore(store, new URL(this.config.databaseURL));
            }

            return store;
        }
        return null;
    }

    private emulateFirestore(store: Firestore, url: URL) {
        connectFirestoreEmulator(store, url.hostname, +url.port || 8080);
        showInfo(`Using emulator on ${url.host}`);
        currentStores.add(store);
    }

    getStorage(): FirebaseStorage | null {
        if (this.app) {
            // define storage bucket, otherwise emulator will crash bc of invalid url "match /b/{bucket}/o" in storage.rules
            const bucket = this.useEmulator ? EMULATOR_KEY : undefined;
            const storage = getStorage(this.app, bucket);
            if (this.useEmulator && this.config.storageBucket && !currentStorages.has(storage)) {
                const url = new URL(this.config.storageBucket);
                if (!url.hostname.match('^.+\.appspot\.com$')) {
                    connectStorageEmulator(storage, url.hostname, +url.port || 8188);
                    showInfo(`Using emulator on ${url.hostname}:${url.port}`);
                    currentStorages.add(storage);
                }
            }

            return storage;
        }
        return null;
    }

    getAuth(): Auth | null {
        if (this.app) {
            const auth = getAuth(this.app);
            if (!currentAuths.has(auth)) {
                onAuthStateChanged(auth, this.setSufficientUser);
                if (this.useEmulator) {
                    if (!this.config.authDomain) {
                        this.config.authDomain = 'http://localhost:9099';
                    }
                    connectAuthEmulator(auth, this.config.authDomain, { disableWarnings: true });
                }
                currentAuths.add(auth);
            }
            return auth;
        }

        return null;
    }

    async signIn(): Promise<void> {
        const auth = this.getAuth();
        if (auth) {
            const credentials = auth && this.useEmulator 
                ? await this.signInToEmulator(auth)
                : await signInWithPopup(auth, new GoogleAuthProvider());

            await this.setSufficientUser(credentials.user);
        }
    }

    private async setSufficientUser(user: User | null): Promise<void> {
        if (user) {
            const { claims } = await user.getIdTokenResult(false);
            if (!this.editRole || claims.role === this.editRole) {
                showWarn(`Logged in as ${this.editRole ?? user.displayName}!`);
                currentClientUser.set(user);
                return;
            } 
            
            showError(`You are not an ${this.editRole}!
Set role to "${this.editRole}" with set-admin script and this uid: ${user.uid}`, 10);
        }
        currentClientUser.set(null);
    }

    private async signInToEmulator(auth: Auth): Promise<UserCredential> {
        const credentials = EmailAuthProvider.credential(userForEmulator.email, userForEmulator.password);
        try {
            return await signInWithCredential(auth, credentials);
        } catch (error: any) {
            if (error.code == 'auth/user-not-found') {
                await this.seedAuthEmulator();
                return await signInWithCredential(auth, credentials);
            }

            throw error;
        }
    }

    private async seedAuthEmulator() {
        const res = await fetch(`${this.config.authDomain}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.config.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userForEmulator)
        });

        if (res.ok) {
            const data = await res.json();
            showInfo('Created user ' + data.displayName);
            console.log(data);
        }
    }

    signOut() {        
        const auth = this.getAuth();
        if (auth) {
            signOut(auth);
            showInfo('Signed out');
        }
    }
}

