import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { consumerPreviews } from './scripts/astro-consumer-previews.mjs'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), consumerPreviews()],
    resolve: { alias: {
      'cn': fileURLToPath(new URL('./examples/shadcn/lib/utils.ts', import.meta.url)),
      '@/lib/utils': fileURLToPath(new URL('./examples/shadcn/lib/utils.ts', import.meta.url)),
      '@/registry/new-york-v4/ui': fileURLToPath(new URL('./vendor/shadcn/new-york-v4/ui', import.meta.url)),
    } },
  },
})
