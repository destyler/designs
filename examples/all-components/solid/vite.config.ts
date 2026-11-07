import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [solid()],
  build: {
    outDir: fileURLToPath(new URL('../../../dist/all-components/solid', import.meta.url)),
    emptyOutDir: true,
  },
})
