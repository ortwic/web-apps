import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        globals: true,
        include: ['./src/**/*.{test,spec}.ts'],
        environment: 'jsdom',
        setupFiles: ['src/setuptest.ts'],
    },
});
