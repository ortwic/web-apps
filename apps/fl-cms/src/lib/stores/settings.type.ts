import type { FirebaseOptions } from "firebase/app";

export type AppConfig = FirebaseOptions & Required<Pick<FirebaseOptions, 'projectId'>> & {
    customEditRole?: string;
}

export interface AppSettings {
    selectedProjectId: string;
    firebaseConfigs: Record<string, AppConfig>;
}

