import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
    plugins: [
        sveltekit(),
        SvelteKitPWA({
            strategies: 'generateSW',
            srcDir: 'src',
            includeAssets: [],
            manifest: {
                name: 'Why App',
                short_name: 'Why App',
                start_url: '/',
                description: 'A philosophical tool for your existential journey.',
                display: 'fullscreen',
                background_color: '#93d1db',
                theme_color: '#ffec00',
                lang: 'en',
                scope: '/',
                categories: ['education', 'health', 'lifestyle', 'personalization'],
                icons: [
                    {
                        src: 'logo-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'logo-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'logo-mono.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'monochrome'
                    }
                ],
                screenshots: [],
                display_override: ['window-controls-overlay'],
                orientation: 'any'
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
                globIgnores: ['**/node_modules/**/*']
            },
            devOptions: { enabled: true },
            selfDestroying: false
        })
    ],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}']
    }
});
