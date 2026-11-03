import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), vue(), tailwindcss()],
  resolve: { alias: {
    'cn': fileURLToPath(new URL('./examples/shadcn/lib/utils.ts', import.meta.url)),
    '@/lib/utils': fileURLToPath(new URL('./examples/shadcn/lib/utils.ts', import.meta.url)),
    '@/registry/new-york-v4/ui': fileURLToPath(new URL('./vendor/shadcn/new-york-v4/ui', import.meta.url)),
  } },
  build: { rollupOptions: { input: {
    main: fileURLToPath(new URL('./index.html', import.meta.url)),
    shadcn: fileURLToPath(new URL('./examples/shadcn/index.html', import.meta.url)),
    nativeContract: fileURLToPath(new URL('./examples/native-contract/index.html', import.meta.url)),
    legacy: fileURLToPath(new URL('./examples/scoped-themes/index.html', import.meta.url)),
    legacyChecks: fileURLToPath(new URL('./examples/scoped-themes/checks.html', import.meta.url)),
  } } },
})
