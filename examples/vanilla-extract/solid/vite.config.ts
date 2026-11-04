import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import UnoCSS from 'unocss/vite'
import { presetWind3 } from 'unocss'
import { fileURLToPath, URL } from 'node:url'
// Consumer: no vanilla-extract transform, no Tailwind plugin, no package source alias.
export default defineConfig({
  base: './',
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [solid(), UnoCSS({ configFile: false, presets: [presetWind3()], rules: [['fixture-utility-override', { 'border-radius': '0px', 'padding-left': '32px', 'padding-right': '32px' }]] })],
  resolve: { alias: {
    '@destyler/designs-vanilla-extract-poc/styles.css': fileURLToPath(new URL('../../../packages/vanilla-extract/dist/styles.css', import.meta.url)),
    '@destyler/designs-vanilla-extract-poc': fileURLToPath(new URL('../../../packages/vanilla-extract/dist/index.js', import.meta.url)),
  } },
  build: { outDir: fileURLToPath(new URL('../../../dist/vanilla-extract/solid', import.meta.url)), emptyOutDir: true },
})
