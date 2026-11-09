// Pure helpers: importing this module never starts or connects to a browser.
export const families = ['checkbox', 'tabs', 'calendar']
export const frameworks = ['shadcn', 'react', 'vue', 'solid', 'svelte']
export const themes = ['light', 'dark']
export const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]
export const styleKeys = ['width', 'height', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderRadius', 'backgroundColor', 'color', 'fontSize', 'fontWeight', 'lineHeight', 'boxShadow', 'outlineWidth', 'outlineStyle', 'outlineColor', 'outlineOffset', 'opacity', 'pointerEvents']
// Only naturally present states are accepted. No synthetic attributes are injected.
export const requiredStates = {
  checkbox: ['default', 'checked-keyboard-focus', 'checked-blurred', 'unchecked-keyboard-focus'],
  tabs: ['default', 'selected-keyboard-focus', 'unselected', 'disabled', 'selected-blurred'],
  calendar: ['default', 'focused-unselected-day', 'selected-keyboard-focus-day', 'selected-blurred-day'],
}
export const disabledCoverage = {
  checkbox: 'not-covered: the actual Checkbox gallery example has no disabled fixture',
  tabs: 'actual-fixture: disabled Svelte tab, measured and skipped by keyboard navigation',
  calendar: 'not-covered: reference has navigation bounds but no matching disabled-date fixture',
}
export function missingStates(family, states) {
  return requiredStates[family].filter(state => !Object.hasOwn(states, state))
}

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
