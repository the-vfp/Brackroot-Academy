import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Brackroot-Academy/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'Brackroot Academy — Life Tracker',
        short_name: 'Brackroot',
        description: 'A cozy dark academia spending tracker',
        theme_color: '#1a1410',
        background_color: '#1a1410',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: '\u{1F4FF} Habits',
            short_name: 'Habits',
            url: './?tab=habits',
            description: "Today's habits",
            icons: [{ src: 'icons/shortcut-habits.svg', sizes: '192x192', type: 'image/svg+xml' }]
          },
          {
            name: '\u{1F58B}️ Tasks',
            short_name: 'Tasks',
            url: './?tab=tasks',
            description: 'Open tasks',
            icons: [{ src: 'icons/shortcut-tasks.svg', sizes: '192x192', type: 'image/svg+xml' }]
          },
          {
            name: '\u{1F56F}️ Time',
            short_name: 'Time',
            url: './?tab=time',
            description: 'Log time',
            icons: [{ src: 'icons/shortcut-time.svg', sizes: '192x192', type: 'image/svg+xml' }]
          },
          {
            name: 'Quick Log',
            short_name: 'Log',
            url: './?tab=spend',
            description: 'Log an expense',
            icons: [{ src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ]
});
