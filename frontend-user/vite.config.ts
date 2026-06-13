import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

// Manually define __dirname and __filename in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routeConfig = {
  apiPrefix: '/api/v1',
  target: 'http://192.168.255.142:5000'
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
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
          { src: '/hero.png', sizes: '192x192', type: 'image/png' },
          { src: '/hero.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      // Added workbox config to ensure assets and API are cached correctly
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith(routeConfig.apiPrefix),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
        ],
      },
    })
  ],
  server: {
    host: "0.0.0.0",

    proxy: {
      [routeConfig.apiPrefix]: {
        target: routeConfig.target,
        changeOrigin: true,
        // REMOVED the rewrite function so /api/v1 is kept in the URL path
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
