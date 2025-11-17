import type { FirebaseOptions } from "firebase/app";

export interface AppSettings {
    selectedProjectId: string;
    firebaseConfigs: Record<string, FirebaseOptions>;
}

