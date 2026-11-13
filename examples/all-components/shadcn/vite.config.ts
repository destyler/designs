import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export const aliases = {
  'cn': fileURLToPath(new URL('../../shadcn/lib/utils.ts', import.meta.url)),
  '@/lib/utils': fileURLToPath(new URL('../../shadcn/lib/utils.ts', import.meta.url)),
  '@/registry/new-york-v4/ui': fileURLToPath(new URL('../../../vendor/shadcn/new-york-v4/ui', import.meta.url)),
}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: aliases },
  build: {
    outDir: fileURLToPath(new URL('../../../dist/all-components/shadcn', import.meta.url)),
    emptyOutDir: true,
  },
})
