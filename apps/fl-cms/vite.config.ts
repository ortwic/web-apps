import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'utils': ['rxjs', 'rxfire', 'luxon', 'nanoid', 'object-hash', 'json5'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/analytics'],
          'firestore': ['firebase/firestore'],
          'tabulator': ['@web-apps/svelte-tabulator'],
          'codemirror': [
            'codemirror',
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/lang-json',
            '@codemirror/theme-one-dark'
          ],
          'bytemd': ['bytemd'],
        },
      },
    },
  },
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true
      }
    }),
    VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [],
        manifest: {
            name: 'Fl-CMS',
            short_name: 'Fl-CMS',
            start_url: '/',
            description: 'Simple Firebase Content Management System.',
            display: 'fullscreen',
            background_color: '#303030',
            theme_color: '#80c0ff',
            lang: 'en',
            scope: '/',
            categories: ['CMS', 'productivity', 'utilities'],
            icons: [
                {
                    src: 'icons/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any',
                },
                {
                    src: 'icons/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                },
                {
                    src: 'icons/icon-192-mono.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'monochrome',
                },
                {
                    src: 'icons/icon-512-mono.png',
                    sizes: '512x512',
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
    port: 5000
  }
})
