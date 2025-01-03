import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Le-Petit-Bac/',
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        // Ajoutez ici d'autres points d'entrée HTML si nécessaire
      }
    }
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@config': '/config',
      '@css': '/css',
      '@js': '/js',
      '@html': '/html'
    }
  }
}) 