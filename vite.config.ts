/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` must match the GitHub Pages project path for production builds, but
// stay at root for local dev (`npm run dev`).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Budget-Tracking/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}))
