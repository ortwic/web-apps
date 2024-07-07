import json from 'json5';
import type { FirebaseOptions } from "firebase/app";
import { derived, writable } from 'svelte/store';

export interface AppSettings {
    selectedProjectId: string;
    firebaseConfigs: Record<string, FirebaseOptions>;
}

export const CONFIG_KEY = 'firelighter-settings';
export const settingsStore = writable<AppSettings>({
    selectedProjectId: '',
    firebaseConfigs: {}
});
export const currentFirebaseConfig = derived(settingsStore, (settings) => settings.firebaseConfigs[settings.selectedProjectId]);

export function saveSelectedProjectId(projectId: string): AppSettings {
    const settings = loadSettings();
    settings.selectedProjectId = projectId;
    return saveSettings(settings);
}

export function saveFirebaseConfig(projectId: string, config: FirebaseOptions): AppSettings {
    const settings = loadSettings();
    settings.firebaseConfigs[projectId] = config;
    settings.selectedProjectId = projectId;
    return saveSettings(settings);
}

export function removeFirebaseConfig(projectId: string): AppSettings {
    const settings = loadSettings();
    delete settings.firebaseConfigs[projectId];
    settings.selectedProjectId = Object.keys(settings.firebaseConfigs).at(0) ?? '';
    return saveSettings(settings);
}

export function loadSettings(): AppSettings {
    const value = localStorage.getItem(CONFIG_KEY);
    return value && json.parse<AppSettings>(value) || {
        selectedProjectId: '',
        firebaseConfigs: {}
    };
}

function saveSettings(settings: AppSettings): AppSettings {
    settingsStore.set(settings);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(settings));
    return settings;
}