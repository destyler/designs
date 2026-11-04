import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
// Reference only: upstream shadcn requires Tailwind. Destyler consumers do not.
export default defineConfig({
  base: './', root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: { alias: {
    'cn': fileURLToPath(new URL('../../shadcn/lib/utils.ts', import.meta.url)),
    '@/registry/new-york-v4/ui': fileURLToPath(new URL('../../../vendor/shadcn/new-york-v4/ui', import.meta.url)),
  } },
  build: { outDir: fileURLToPath(new URL('../../../dist/css-only/reference', import.meta.url)), emptyOutDir: true },
})
