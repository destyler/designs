import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)), base: './',
  plugins: [svelte({ configFile: false })],
  ssr: { external: ['svelte', 'svelte/internal/server', 'svelte/internal/shared'] },
  build: { outDir: fileURLToPath(new URL('../../../dist/all-components/svelte', import.meta.url)), emptyOutDir: true },
})
