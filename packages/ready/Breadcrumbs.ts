export interface BreadcrumbsItem {
  label: string
  /** Required for ancestors; optional for the final/current page. */
  href?: string
}

export interface BreadcrumbsProps {
  /** Ordered from the outermost ancestor to the current page. */
  items: readonly BreadcrumbsItem[]
  label?: string
  separator?: string
}

export function prepareBreadcrumbs(items: BreadcrumbsProps['items']) {
  return items.map((item, index) => {
    const current = index === items.length - 1
    if (typeof item.label !== 'string' || !item.label.trim()) {
      throw new Error('Ready Breadcrumbs: item labels must contain non-whitespace text.')
    }
    if ((!current || item.href !== undefined) && (typeof item.href !== 'string' || !item.href.trim())) {
      throw new Error('Ready Breadcrumbs: ancestor items require an href; supplied hrefs must be nonempty.')
    }
    // Strip URL-parser whitespace before checking executable schemes; relative and
    // fragment URLs remain untouched for native navigation and app routers.
    if (item.href && /^(?:javascript|vbscript|data):/i.test(item.href.replace(/[\u0000-\u0020]/g, ''))) {
      throw new Error('Ready Breadcrumbs: executable href schemes are not supported.')
    }
    return { source: item, id: String(index), label: item.label, href: item.href, current }
  })
}
