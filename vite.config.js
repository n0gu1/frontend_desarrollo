// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    vuetify({ autoImport: true }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5212', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5212', changeOrigin: true }, // ⬅️ nuevo
    },
  },
})
