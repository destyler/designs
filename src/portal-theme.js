/** Explicit public tokens; unrelated custom properties are never copied. */
export const themeTokens = Object.freeze([
  '--ds-bg', '--ds-fg', '--ds-muted', '--ds-accent', '--ds-on-accent',
  '--ds-border', '--ds-radius', '--ds-font', '--ds-shadow',
])

/**
 * Transfer a source root's computed tokens to an otherwise independent portal.
 * Call sync after ancestor/class/stylesheet changes outside the source root.
 * Cleanup restores the portal's original attributes and inline token declarations.
 */
export function bindPortalTheme(source, portal, {
  getStyle = element => element.ownerDocument.defaultView.getComputedStyle(element),
  Observer = source?.ownerDocument?.defaultView?.MutationObserver,
} = {}) {
  if (!source || !portal || source === portal || source.contains(portal) || portal.contains(source)) {
    throw new TypeError('Source and portal must be separate, non-nested elements')
  }
  const attributes = ['data-theme-root', 'data-skin', 'data-theme']
  const previousAttributes = attributes.map(name => [name, portal.getAttribute(name)])
  const previousTokens = themeTokens.map(name => [name, portal.style.getPropertyValue(name), portal.style.getPropertyPriority(name)])
  let disposed = false
  function sync() {
    if (disposed) return
    const computed = getStyle(source)
    portal.setAttribute('data-theme-root', '')
    for (const name of attributes.slice(1)) {
      const value = source.getAttribute(name)
      if (value === null) portal.removeAttribute(name)
      else portal.setAttribute(name, value)
    }
    for (const name of themeTokens) {
      const value = computed.getPropertyValue(name).trim()
      if (value) portal.style.setProperty(name, value)
      else portal.style.removeProperty(name)
    }
  }
  sync()
  const observer = Observer ? new Observer(sync) : null
  observer?.observe(source, { attributes: true, attributeFilter: ['data-skin', 'data-theme', 'style', 'class'] })
  return {
    sync,
    dispose() {
      if (disposed) return
      disposed = true
      observer?.disconnect()
      for (const [name, value] of previousAttributes) {
        if (value === null) portal.removeAttribute(name)
        else portal.setAttribute(name, value)
      }
      for (const [name, value, priority] of previousTokens) {
        if (value) portal.style.setProperty(name, value, priority)
        else portal.style.removeProperty(name)
      }
    },
  }
}
