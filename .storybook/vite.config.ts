import { defineConfig } from 'vite'

// Storybook uses the native compilers from main.ts, not the legacy site's
// Tailwind pipeline or its unrelated production HTML entry points.
export default defineConfig({})
