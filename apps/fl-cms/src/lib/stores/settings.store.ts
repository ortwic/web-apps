import json from 'json5';
import { writable } from 'svelte/store';
import { EMULATOR_HOSTNAME, getProjectKey } from '../utils/app.helper';
import type { AppConfig, AppSettings } from './settings.type';

export const CONFIG_KEY = 'firelighter-settings';
export const DefaultAppSettings: AppSettings = {
    selectedProjectId: '',
    firebaseConfigs: {
        localhost: {
            apiKey: 'default',
            authDomain: `http://${EMULATOR_HOSTNAME}:9099`,
            databaseURL: `http://${EMULATOR_HOSTNAME}:8080`,
            projectId: 'your-project-id',
            storageBucket: `http://${EMULATOR_HOSTNAME}:8188`,
            messagingSenderId: 'default',
            appId: `1:2:${EMULATOR_HOSTNAME}:4`
        }
    }
};
export const settingsStore = writable<AppSettings>(DefaultAppSettings);

export function saveSelectedProjectId(projectId: string): AppSettings {
    const settings = loadSettings();
    settings.selectedProjectId = projectId;
    return saveSettings(settings);
}

export function saveFirebaseConfig(config: AppConfig): AppSettings {
    const settings = loadSettings();

    const key = getProjectKey(config);
    settings.firebaseConfigs[key] = config;
    settings.selectedProjectId = key;
    
    return saveSettings(settings);
}

export function removeFirebaseConfig(config: AppConfig): AppSettings {
    const settings = loadSettings();
    
    const key = getProjectKey(config);
    delete settings.firebaseConfigs[key];
    settings.selectedProjectId = Object.keys(settings.firebaseConfigs).at(0) ?? '';

    return saveSettings(settings);
}

export function loadSettings(): AppSettings {
    const value = localStorage.getItem(CONFIG_KEY);
    return value && json.parse<AppSettings>(value) || DefaultAppSettings;
}

export function anySettings(): boolean {
    return localStorage.getItem(CONFIG_KEY) !== null;
}

function saveSettings(settings: AppSettings): AppSettings {
    settingsStore.set(settings);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(settings));
    return settings;
}