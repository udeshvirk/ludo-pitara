import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ludo-pitara/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Ludo Pitara',
        short_name: 'Ludo Pitara',
        description: 'Free Ludo, Snakes & Ladders and Dice. No ads, plays offline.',
        start_url: '/ludo-pitara/',
        scope: '/ludo-pitara/',
        display: 'standalone',
        // Allow installed PWAs to rotate freely — wide layout handles
        // landscape on iPad, tablet/phone layouts handle portrait.
        orientation: 'any',
        background_color: '#190a2e',
        theme_color: '#190a2e',
        // Phone screenshots give Android Chrome its richer install sheet.
        screenshots: [
          { src: 'screenshots/ludo.png', sizes: '585x1266', type: 'image/png', form_factor: 'narrow', label: 'Ludo' },
          { src: 'screenshots/snakes-and-ladders.png', sizes: '585x1266', type: 'image/png', form_factor: 'narrow', label: 'Snakes & Ladders' },
          { src: 'screenshots/game-select.png', sizes: '585x1266', type: 'image/png', form_factor: 'narrow', label: 'Choose a game' },
        ],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Marketing images aren't needed to play offline.
        globIgnores: ['og-image.png', 'screenshots/**'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
