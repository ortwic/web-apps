import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    CONFIG_KEY,
    DefaultAppSettings,
    anySettings,
    loadSettings,
    removeFirebaseConfig,
    saveFirebaseConfig,
    saveSelectedProjectId,
    settingsStore,
} from './settings.store';
import type { AppConfig, AppSettings } from './settings.type';
import { get } from 'svelte/store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A valid minimal AppConfig for use across tests. */
const makeConfig = (projectId: string): AppConfig => ({
    apiKey: 'key-' + projectId,
    authDomain: 'auth.' + projectId,
    databaseURL: 'db.' + projectId,
    projectId,
    storageBucket: 'bucket.' + projectId,
    messagingSenderId: 'msg-' + projectId,
    appId: 'app-' + projectId,
});

/** Seed localStorage with a given AppSettings object. */
function seedLocalStorage(settings: AppSettings): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(settings));
}

/** Read and parse whatever is currently in localStorage. */
function readLocalStorage(): AppSettings {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) {
        throw new Error('localStorage is empty — did you forget to seed it?');
    }
    return JSON.parse(raw) as AppSettings;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => localStorage.clear());

describe('loadSettings()', () => {
    it('should return DefaultAppSettings when localStorage is empty', () => {
        // Arrange: localStorage is empty (cleared in beforeEach)

        // Act
        const result = loadSettings();

        // Assert
        expect(result).toEqual(DefaultAppSettings);
    });

    it('should return parsed settings when localStorage contains valid JSON', () => {
        // Arrange
        const stored: AppSettings = {
            selectedProjectId: 'my-project',
            firebaseConfigs: { 'my-project': makeConfig('my-project') },
        };
        seedLocalStorage(stored);

        // Act
        const result = loadSettings();

        // Assert
        expect(result).toEqual(stored);
    });

    it('should parse json5 with trailing commas without throwing', () => {
        // Arrange: json5 is more lenient than JSON — trailing commas are valid
        const json5Value = `{ "selectedProjectId": "p1", "firebaseConfigs": { "p1": { "projectId": "p1", } } }`;
        localStorage.setItem(CONFIG_KEY, json5Value);

        // Act & Assert: must not throw
        expect(() => loadSettings()).not.toThrow();
    });

    it('should throw when localStorage contains invalid JSON5', () => {
        // Arrange: corrupt data — e.g. truncated write
        localStorage.setItem(CONFIG_KEY, '{ broken ::');

        // Assert: documents current behavior — no error boundary exists yet.
        // If this test starts failing after a fix, update it to expect a fallback.
        expect(() => loadSettings()).toThrow();
    });

    it('should return DefaultAppSettings when localStorage value is empty string', () => {
        // Arrange: edge case — key exists but value is empty
        localStorage.setItem(CONFIG_KEY, '');

        // Act
        const result = loadSettings();

        // Assert: empty string is falsy → falls back to DefaultAppSettings
        expect(result).toEqual(DefaultAppSettings);
    });
});

describe('anySettings()', () => {
    it('should return false when localStorage is empty', () => {
        expect(anySettings()).toBe(false);
    });

    it('should return true when settings exist in localStorage', () => {
        // Arrange
        seedLocalStorage(DefaultAppSettings);

        // Act & Assert
        expect(anySettings()).toBe(true);
    });
});

describe('saveSelectedProjectId()', () => {
    it('should update selectedProjectId in localStorage', () => {
        // Arrange
        const initial: AppSettings = {
            selectedProjectId: 'old-project',
            firebaseConfigs: { 'old-project': makeConfig('old-project') },
        };
        seedLocalStorage(initial);

        // Act
        saveSelectedProjectId('new-project');

        // Assert
        expect(readLocalStorage().selectedProjectId).toBe('new-project');
    });

    it('should preserve existing firebaseConfigs when updating selectedProjectId', () => {
        // Arrange
        const config = makeConfig('alpha');
        const initial: AppSettings = {
            selectedProjectId: 'alpha',
            firebaseConfigs: { alpha: config },
        };
        seedLocalStorage(initial);

        // Act
        saveSelectedProjectId('beta');

        // Assert: configs untouched
        expect(readLocalStorage().firebaseConfigs).toEqual({ alpha: config });
    });

    it('should update the Svelte store with the new settings', () => {
        // Arrange
        seedLocalStorage({ selectedProjectId: 'x', firebaseConfigs: {} });

        // Act
        saveSelectedProjectId('y');
        
        // Assert: reactive layer notified
        const result = get(settingsStore);
        expect(result.selectedProjectId).toBe('y');
    });

    it('should return the updated settings object', () => {
        // Arrange
        seedLocalStorage({ selectedProjectId: 'old', firebaseConfigs: {} });

        // Act
        const result = saveSelectedProjectId('new');

        // Assert
        expect(result.selectedProjectId).toBe('new');
    });
});

describe('saveFirebaseConfig()', () => {
    it('should add a new config and set it as selectedProjectId', () => {
        // Arrange
        seedLocalStorage({ selectedProjectId: '', firebaseConfigs: {} });
        const config = makeConfig('new-project');

        // Act
        saveFirebaseConfig(config);

        // Assert
        const saved = readLocalStorage();
        expect(saved.firebaseConfigs['new-project']).toEqual(config);
        expect(saved.selectedProjectId).toBe('new-project');
    });

    it('should overwrite an existing config without removing others', () => {
        // Arrange
        const existing = makeConfig('alpha');
        const other = makeConfig('beta');
        seedLocalStorage({
            selectedProjectId: 'alpha',
            firebaseConfigs: { alpha: existing, beta: other },
        });
        const updated = { ...makeConfig('alpha'), apiKey: 'updated-key' };

        // Act
        saveFirebaseConfig(updated);

        // Assert: alpha overwritten, beta preserved
        const saved = readLocalStorage();
        expect(saved.firebaseConfigs['alpha'].apiKey).toBe('updated-key');
        expect(saved.firebaseConfigs['beta']).toEqual(other);
    });

    it('should update the Svelte store after saving', () => {
        // Arrange
        seedLocalStorage({ selectedProjectId: '', firebaseConfigs: {} });

        // Act
        saveFirebaseConfig(makeConfig('p1'));

        // Assert
        const result = get(settingsStore);
        expect(result.selectedProjectId).toBe('p1');
        expect(result.firebaseConfigs['p1']).toBeTruthy();
    });
});

describe('removeFirebaseConfig()', () => {
    it('should remove the config from localStorage', () => {
        // Arrange
        const config = makeConfig('to-remove');
        seedLocalStorage({
            selectedProjectId: 'to-remove',
            firebaseConfigs: { 'to-remove': config },
        });

        // Act
        removeFirebaseConfig(config);

        // Assert
        expect(readLocalStorage().firebaseConfigs['to-remove']).toBeUndefined();
    });

    it('should select the first remaining config after removal', () => {
        // Arrange
        const alpha = makeConfig('alpha');
        const beta = makeConfig('beta');
        seedLocalStorage({
            selectedProjectId: 'beta',
            firebaseConfigs: { alpha, beta },
        });

        // Act
        removeFirebaseConfig(beta);

        // Assert: alpha is the only remaining key
        expect(readLocalStorage().selectedProjectId).toBe('alpha');
    });

    it('should set selectedProjectId to empty string when last config is removed', () => {
        // Arrange: only one config — removing it leaves nothing
        const config = makeConfig('last-one');
        seedLocalStorage({
            selectedProjectId: 'last-one',
            firebaseConfigs: { 'last-one': config },
        });

        // Act
        removeFirebaseConfig(config);

        // Assert: fallback to '' — this is the critical edge case
        const saved = readLocalStorage();
        expect(saved.selectedProjectId).toBe('');
        expect(Object.keys(saved.firebaseConfigs)).toHaveLength(0);
    });

    it('should update the Svelte store after removal', () => {
        // Arrange
        const config = makeConfig('to-remove');
        seedLocalStorage({
            selectedProjectId: 'to-remove',
            firebaseConfigs: { 'to-remove': config },
        });

        // Act
        removeFirebaseConfig(config);

        // Assert
        const result = get(settingsStore);
        expect(result.selectedProjectId).toBe('');
        expect(result.firebaseConfigs['to-remove']).toBeUndefined();
    });

    it('should preserve other configs when removing one', () => {
        // Arrange
        const alpha = makeConfig('alpha');
        const beta = makeConfig('beta');
        const gamma = makeConfig('gamma');
        seedLocalStorage({
            selectedProjectId: 'beta',
            firebaseConfigs: { alpha, beta, gamma },
        });

        // Act
        removeFirebaseConfig(beta);

        // Assert: alpha and gamma intact
        const saved = readLocalStorage();
        expect(saved.firebaseConfigs['alpha']).toEqual(alpha);
        expect(saved.firebaseConfigs['gamma']).toEqual(gamma);
        expect(saved.firebaseConfigs['beta']).toBeUndefined();
    });
});