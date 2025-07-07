import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3003,
  },
  build: {
    outDir: 'dist',
    // VS Code拡張で使うために単一ファイルにバンドル
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})