import { get } from "svelte/store";
import type { FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, EmailAuthProvider, signInWithCredential } from "firebase/auth";
import { Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { nanoid } from "nanoid";
import { currentClientAuth } from "./firebase.store";
import { showError, showInfo } from "./notification.store";
import { EMULATOR_KEY } from "./settings.store";
import type { AppSettings } from "./settings.type";

const emulatorConnected = new WeakSet<Firestore>();

export default class Emulator {
    config: FirebaseOptions;
    eligible: boolean;
    authDomain: string;

    constructor(private store: Firestore, settings: AppSettings, private username = nanoid().slice(0, 5)) {
        this.config = settings.firebaseConfigs[settings.selectedProjectId];
        this.eligible = settings.selectedProjectId.includes(EMULATOR_KEY);
        this.authDomain = this.config.authDomain || 'http://localhost:9099';
    }

    get isConnected() {
        return emulatorConnected.has(this.store);
    }

    maybeConnect(): boolean {
        try {
            if (this.eligible && !this.isConnected) {
                this.connectFirestore(this.store);
                emulatorConnected.add(this.store);

                this.connectAuthAsync();
                return true;
            }
        } catch (error: any) {
            showError(error);
        }

        return false;
    }

    maybeDisconnect() {
        if (this.isConnected) {
            // emulatorConnected.delete(this.store);
            return true;
        }
        return false;
    }

    private connectFirestore(store: Firestore) {
        if (this.config.databaseURL) {
            const url = new URL(this.config.databaseURL);

            connectFirestoreEmulator(store, url.host, +url.port || 8080);
            showInfo(`Using emulator on ${url.host}:${url.port}`);
        }
    }

    async connectAuthAsync() {
        if (this.isConnected && this.eligible) {
            const user = await this.seedAuthEmulator();
            const cred = EmailAuthProvider.credential(user.email, user.password);
            const auth = get(currentClientAuth);
            if (auth) {
                connectAuthEmulator(auth, this.authDomain, { disableWarnings: true });
                return await signInWithCredential(auth, cred);
            }
        }
        return null;
    }

    private async seedAuthEmulator() {
        const user = {
            email: `${this.username}@example.com`,
            password: nanoid(),
            displayName: `Emul ${this.username}`,
            returnSecureToken: true
        };
        const res = await fetch(`${this.authDomain}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.config.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        if (!res.ok) {
            throw new Error(`Auth seeding failed: ${res.statusText}`);
        }

        const data = await res.json();
        console.debug('Created test user:', data.email);
        console.log(data);
        return user;
    }
}

