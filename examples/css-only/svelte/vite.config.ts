import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath, URL } from 'node:url'
// Ordinary framework compiler only. A CSS import needs no design-system plugin.
export default defineConfig({
  base: './',
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [svelte()],
  resolve: { alias: {
    '@destyler/designs-css-only-poc/styles.css': process.env.CSS_ONLY_PACKAGE_CSS || fileURLToPath(new URL('../../../packages/css-only/styles.css', import.meta.url)),
  } },
  build: { outDir: fileURLToPath(new URL('../../../dist/css-only/svelte', import.meta.url)), emptyOutDir: true },
})
