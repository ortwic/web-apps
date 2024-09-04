import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
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
  plugins: [svelte()],
  server: {
    port: 5000
  }
})
