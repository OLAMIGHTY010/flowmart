import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

// Manually define __dirname and __filename in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Flowmart',
        short_name: 'Flowmart',
        description: 'Your One-Stop Shop',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        icons: [
          { src: '/hero.png', sizes: '192x192', type: 'image/png' },
          { src: '/hero.png', sizes: '512x512', type: 'image/png' }
        ]
      },
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
