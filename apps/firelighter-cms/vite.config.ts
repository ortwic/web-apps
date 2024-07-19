import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'firebase': ['firebase/app', 'firebase/auth', 'firebase/analytics'],
                    'firestore': ['firebase/firestore'],
                    'tabulator-tables': ['tabulator-tables'],
                }
            }
        }
    },
    plugins: [
        sveltekit()
    ],
    resolve: {
        alias: {
            '@web-apps/svelte-tabulator': path.resolve(__dirname, '../../packages/svelte-tabulator/dist')
        }
    },
    server: {
        port: 5000
    },
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}']
    }
});
