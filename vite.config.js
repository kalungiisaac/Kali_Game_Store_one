import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/igdb': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        details: resolve(__dirname, 'game-details.html'),
        wishlist: resolve(__dirname, 'wishlist.html'),
        upcoming: resolve(__dirname, 'upcoming.html'),
        comparison: resolve(__dirname, 'comparison.html')
      }
    }
  }
})
