import type { AppConfig } from "../stores/settings.type";

export const EMULATOR_HOSTNAME = 'localhost';

export function getProjectKey(config: AppConfig) {
    return shouldUseEmulator(config.appId) 
        ? `${config.projectId}:${EMULATOR_HOSTNAME}` 
        : config.projectId;
}

export function shouldUseEmulator(config?: string): boolean {
    return config && config.split(/\/|:/).indexOf(EMULATOR_HOSTNAME) > -1 || false;
}