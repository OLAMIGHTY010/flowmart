import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // devOptions: {
      //   enabled: true
      // },

      manifest: {
        name: 'Flowmart',
        short_name: 'Flowmart Admindashboard',
        description: 'Admin dashboard - Your One-Stop Shop',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        start_url: '/',
        scope: '/',
        display: 'standalone',

        icons: [
          {
            src: '/hero.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/hero.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
