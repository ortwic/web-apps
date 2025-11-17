import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'firebase': ['firebase/app', 'firebase/auth', 'firebase/analytics'],
                    'firestore': ['firebase/firestore'],
                },
            },
        },
    },
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        globals: true,
        include: ['./src/**/*.{test,spec}.ts'],
        environment: 'jsdom',
        setupFiles: ['src/setuptest.ts'],
        browser: {
            enabled: false,
            provider: 'preview',
            instances: [
                {
                    browser: 'thorium',
                }
            ]
        },
    },
    server: {
        port: 5000
    },
});
