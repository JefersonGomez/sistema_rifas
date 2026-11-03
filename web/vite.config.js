import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // App instalable en el celular. Solo guarda en caché la interfaz; los datos (/api)
    // siempre se piden al servidor para que mamá nunca vea números o pagos viejos.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rifas Ivannia',
        short_name: 'Rifas',
        description: 'Números libres de la rifa y panel para manejarla.',
        lang: 'es-CR',
        start_url: '/admin',
        scope: '/',
        display: 'standalone',
        background_color: '#FAFAF7',
        theme_color: '#0F766E',
        icons: [
          { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icono-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
  server: {
    host: true, // permite abrirlo desde el celular en la misma red
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
