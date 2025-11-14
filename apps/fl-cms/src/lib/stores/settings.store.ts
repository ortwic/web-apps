import json from 'json5';
import type { FirebaseOptions } from "firebase/app";
import { derived, writable } from 'svelte/store';
import type { AppSettings } from './settings.type';

export const CONFIG_KEY = 'firelighter-settings';
export const EMULATOR_KEY = 'localhost';
export const DefaultAppSettings: AppSettings = {
    selectedProjectId: '',
    firebaseConfigs: {
        [EMULATOR_KEY]: {
            apiKey: 'default',
            authDomain: 'http://localhost:9099',
            databaseURL: 'http://localhost:8080',
            projectId: EMULATOR_KEY,
            storageBucket: 'http://localhost:8188',
            messagingSenderId: 'default',
            appId: 'default'
        }
    }
};
export const settingsStore = writable<AppSettings>(DefaultAppSettings);

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
    return value && json.parse<AppSettings>(value) || DefaultAppSettings;
}

function saveSettings(settings: AppSettings): AppSettings {
    settingsStore.set(settings);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(settings));
    return settings;
}