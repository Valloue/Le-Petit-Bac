import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/Le-Petit-Bac/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      external: [
        '/css/style.css',
        '/js/main.js'
      ]
    }
  },
  server: {
    open: true
  },
  resolve: {
    alias: {
      '/js': resolve(__dirname, 'js'),
      '/css': resolve(__dirname, 'css'),
      '/html': resolve(__dirname, 'html'),
      '/config': resolve(__dirname, 'config'),
      '/public': resolve(__dirname, 'public')
    }
  }
})