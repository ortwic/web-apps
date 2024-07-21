import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        svelte(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [],
            manifest: {
                name: 'Randomizer app for certain issues',
                short_name: 'Randomizer App',
                start_url: '/',
                description: 'Shaking it all up',
                display: 'fullscreen',
                background_color: '#242424',
                theme_color: '#646cff',
                lang: 'en',
                scope: '/',
                categories: ['issues', 'random', 'games'],
                icons: [
                    {
                        src: 'logo-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: 'logo-mono.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'monochrome',
                    },
                ],
                screenshots: [
                ],
                display_override: ['window-controls-overlay'],
                orientation: 'any',
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
                globIgnores: ['**/node_modules/**/*'],
            },
            devOptions: { enabled: true },
            selfDestroying: false,
        }),
    ],
    server: {
        port: 5100
    },
})
