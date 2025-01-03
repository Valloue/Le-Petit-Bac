import { defineConfig } from 'vite'
import { resolve } from 'path'
import glob from 'fast-glob'

export default defineConfig({
  base: '/Le-Petit-Bac/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(
          glob.sync('html/**/*.html').map(file => [
            file.replace(/(\.html)$/, ''),
            resolve(__dirname, file)
          ])
        )
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@config': resolve(__dirname, 'config'),
      '@css': resolve(__dirname, 'css'),
      '@js': resolve(__dirname, 'js'),
      '@html': resolve(__dirname, 'html'),
      '@public': resolve(__dirname, 'public')
    },
  },
  publicDir: 'public'
}) 