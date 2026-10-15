import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'pwa-192x192.png', 'pwa-512x512.png'],

      // ───────── MANIFIESTO ─────────
      manifest: {
        id: '/',
        name: 'Nova Graf',
        short_name: 'Nova Graf',
        description: 'Impresión, personalización y diseños a tu alcance. Gestión de pedidos de Nova Graf.',
        lang: 'es-MX',
        theme_color: '#1A6163',
        background_color: '#ffffff', // color del splash screen
        display: 'standalone',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'business'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },

      // ───────── SERVICE WORKER (Workbox) ─────────
      workbox: {
        // margen de seguridad: por defecto Workbox ignora archivos de más de 2 MB y tu bundle principal ya pesa ~1.2 MB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,

        // rutas de React Router (/cliente/home, etc.) abren offline con el index.html guardado
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],

        runtimeCaching: [
          // 1) API (solo GET): intenta red 5 s, si falla usa lo último que vio el usuario
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/') &&
              !url.pathname.startsWith('/api/admin/') &&
              !url.pathname.startsWith('/api/users/'),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // 2) Imágenes (productos, Supabase storage, uploads)
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // 3) Estilos de CDN (Google Fonts CSS, Font Awesome)
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://cdnjs.cloudflare.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'cdn-assets' }
          },
          // 4) Archivos de fuentes
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],

   server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },

  preview: {
    port: 5173,
    strictPort: true
  }
})

