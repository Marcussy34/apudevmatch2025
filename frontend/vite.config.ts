import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.ts'),
        background: resolve(__dirname, 'src/background.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'popup' ? 'assets/popup.js' : `assets/${chunkInfo.name}.js`
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  publicDir: 'public'
})

// Add a separate build configuration for background script
if (process.env.BUILD_BACKGROUND) {
  export default defineConfig({
    build: {
      outDir: 'dist/assets',
      lib: {
        entry: resolve(__dirname, 'src/background.ts'),
        name: 'background',
        fileName: 'background',
        formats: ['iife']
      },
      rollupOptions: {
        output: {
          entryFileNames: 'background.js',
          format: 'iife'
        }
      }
    }
  })
}