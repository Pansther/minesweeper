import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,json}'],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'assets/*.png'],
      manifest: {
        name: 'Minesweeper Game',
        short_name: 'Minesweeper',
        description: 'A classic Minesweeper game built with Svelte and Vite.',
        theme_color: '#4A0404',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
          },
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/maskable_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
