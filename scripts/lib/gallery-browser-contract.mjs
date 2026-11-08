// Pure helpers: importing this module never starts or connects to a browser.
export const families = ['checkbox', 'tabs', 'calendar']
export const frameworks = ['shadcn', 'react', 'vue', 'solid', 'svelte']
export const themes = ['light', 'dark']
export const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]
export const styleKeys = ['width', 'height', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRadius', 'backgroundColor', 'color', 'fontSize', 'fontWeight', 'lineHeight', 'boxShadow', 'outlineWidth', 'outlineStyle', 'outlineColor']
export function targetUrl(base, family) {
  const url = new URL(base)
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('BASE_URL must be an HTTP(S) origin')
  if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new Error('BASE_URL must be a bare origin without credentials, query, path or fragment')
  return new URL(`/components/#${family}`, url).href
}
export function styleDifferences(expected, actual, tolerance = 0.5) {
  const differences = []
  for (const [key, value] of Object.entries(expected)) {
    const other = actual[key]
    const px = typeof value === 'string' && typeof other === 'string' && /^-?[\d.]+px$/.test(value) && /^-?[\d.]+px$/.test(other)
    if (px ? Math.abs(parseFloat(value) - parseFloat(other)) > tolerance : value !== other) differences.push({ property: key, reference: value, actual: other })
  }
  return differences
}
export function resultStatus(cases, fatal) {
  if (fatal) return 'blocked'
  return cases.length > 0 && cases.every(item => item.pass) ? 'passed' : 'failed'
}
