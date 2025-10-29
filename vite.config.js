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
      '/api': { target: 'https://baseusuariosapi20251029021137-bnb3cfawhthmhggs.centralus-01.azurewebsites.net', changeOrigin: true },
      '/uploads': { target: 'https://baseusuariosapi20251029021137-bnb3cfawhthmhggs.centralus-01.azurewebsites.net', changeOrigin: true }, // ⬅️ nuevo
    },
  },
})
