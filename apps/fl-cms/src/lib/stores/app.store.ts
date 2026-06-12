import { derived, writable } from "svelte/store";
import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import type { Auth, User, UserCredential } from "firebase/auth";
import { connectAuthEmulator, EmailAuthProvider, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut } from "firebase/auth";
import { Firestore, connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { getProjectKey, shouldUseEmulator } from "../utils/app.helper";
import { showError, showInfo, showWarn } from "./notification.store";
import { settingsStore } from "./settings.store";
import type { AppConfig, AppSettings } from "./settings.type";

export const appStore = derived(settingsStore, (settings) => new FirebaseAppAdapter(settings));
export const currentClientUser = writable<User | null>(null);

const emulatedFirestores = new WeakSet<Firestore>();
const emulatedStorages = new WeakSet<FirebaseStorage>();
const currentAuths = new WeakSet<Auth>();
const userForEmulator = {
    email: `john.doe@example.com`,
    password: 'password',
    displayName: `John Doe`
} as const;

class FirebaseAppAdapter {
    private app: FirebaseApp | null;
    private readonly config: AppConfig;
    private readonly editRole: string | undefined;
    readonly authEmulated: boolean;

    constructor(settings: AppSettings) {
        const { customEditRole, ...config } = settings.firebaseConfigs[settings.selectedProjectId] || {};
        this.config = config;
        this.authEmulated = shouldUseEmulator(this.config.authDomain);
        this.editRole = !this.authEmulated ? customEditRole : undefined;
        this.app = this.getClientApp(this.config);
    }

    get validConfig(): boolean {
        return this.config && 'apiKey' in this.config && 'authDomain' in this.config && 'projectId' in this.config;
    }

    private getClientApp(config: AppConfig): FirebaseApp | null {
        if (config) {
            const name = getProjectKey(config) ?? '[DEFAULT]';
            return getApps().find((app) => app.name === name) ?? initializeApp(config, name);
        }
        return null;
    }

    getFirestore(): Firestore | null {
        if (this.app) {
            const store = getFirestore(this.app);
            if (shouldUseEmulator(this.config.databaseURL) && !emulatedFirestores.has(store)) {
                this.emulateFirestore(store);
            }

            return store;
        }
        return null;
    }

    private emulateFirestore(store: Firestore) {
        const url = new URL(this.config.databaseURL!);
        connectFirestoreEmulator(store, url.hostname, +url.port || 8080);
        showInfo(`Using emulator on ${url.host}`);
        emulatedFirestores.add(store);
    }

    getStorage(): FirebaseStorage | null {
        if (this.app) {
            // define storage bucket, otherwise emulator will crash bc of invalid url "match /b/{bucket}/o" in storage.rules
            const useEmulator = shouldUseEmulator(this.config.storageBucket);
            const bucket = useEmulator ? this.config.projectId : undefined;
            const storage = getStorage(this.app, bucket);
            if (useEmulator && !emulatedStorages.has(storage)) {
                const url = new URL(this.config.storageBucket!);
                connectStorageEmulator(storage, url.hostname, +url.port || 8188);
                showInfo(`Using emulator on ${url.hostname}:${url.port}`);
                emulatedStorages.add(storage);
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
                if (this.authEmulated) {
                    connectAuthEmulator(auth, this.config.authDomain!, { disableWarnings: true });
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
            const { user } = this.authEmulated 
                ? await this.signInToEmulator(auth)
                : await signInWithPopup(auth, new GoogleAuthProvider());
            await this.setSufficientUser(user);
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

    async signOut() {        
        const auth = this.getAuth();
        if (auth) {
            await signOut(auth);
            currentAuths.delete(auth);
            showInfo('Signed out');
        }
    }
}

