import type { StorybookConfig } from '@storybook/html-vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import solid from 'vite-plugin-solid'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mergeConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const reactSources = /(?:\/packages\/ready\/react\/|\/examples\/storybook\/frameworks\/react\.)/
const solidSources = /(?:\/packages\/ready\/solid\/|\/examples\/storybook\/frameworks\/solid\.|\/node_modules\/@destyler-ui\/solid\/)/

const config: StorybookConfig = {
  framework: { name: '@storybook/html-vite', options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } } },
  stories: ['../examples/storybook/stories/*.stories.ts'],
  async viteFinal(config) {
    // The HTML renderer houses a native component, rather than making other
    // frameworks pass through React. Keep the JSX compilers mutually exclusive.
    return mergeConfig(config, {
      plugins: [tailwindcss(), solid({ include: solidSources }), react({ include: reactSources }), vue(), svelte({ configFile: 'examples/storybook/frameworks/svelte.config.js' })],
      resolve: { dedupe: ['solid-js', 'react', 'react-dom', 'vue', 'svelte'] },
      optimizeDeps: { include: ['react', 'react-dom/client', 'vue', 'solid-js', 'solid-js/web', 'svelte'] },
    })
  },
}

export default config
