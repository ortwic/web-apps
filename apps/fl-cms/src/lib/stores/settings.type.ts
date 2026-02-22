import type { FirebaseOptions } from "firebase/app";

export type AppOptions = FirebaseOptions & {
    customEditRole?: string;
}

export interface AppSettings {
    selectedProjectId: string;
    firebaseConfigs: Record<string, AppOptions>;
}

