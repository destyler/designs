import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
export default defineConfig({ root: fileURLToPath(new URL('.', import.meta.url)), base: './', plugins: [vue()], build: { outDir: fileURLToPath(new URL('../../../dist/all-components/vue', import.meta.url)), emptyOutDir: true } })
