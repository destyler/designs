import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
// Ordinary framework compiler only. A CSS import needs no design-system plugin.
export default defineConfig({
  base: './',
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  resolve: { alias: {
    '@destyler/designs-css-only-poc/styles.css': process.env.CSS_ONLY_PACKAGE_CSS || fileURLToPath(new URL('../../../packages/css-only/styles.css', import.meta.url)),
  } },
  build: { outDir: fileURLToPath(new URL('../../../dist/css-only/vue', import.meta.url)), emptyOutDir: true },
})
