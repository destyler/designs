/// <reference types="vite/client" />
// Await the selected CSS before mounting. Never load the Basic theme for the
// existing CSS-only components: its unlayered rules would override the package.
export function loadFamilyStyles(family: string): Promise<unknown> {
  return family === 'switch' || family === 'dialog'
    ? import('./css-only-gallery.css')
    : import('./theme.css')
}
