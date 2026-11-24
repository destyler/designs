import { validateAccessibleText } from './accessible-text'

export type PaginationProps = {
  /** Accessible name of this navigation landmark. */
  label: string
  /** Total number of items, not number of pages. */
  count: number
  /** Positive integer items per page. Defaults to 10. */
  pageSize?: number
  /** Controlled, one-based page. */
  page?: number
  /** Initial uncontrolled, one-based page. Defaults to 1. */
  defaultPage?: number
  previousLabel?: string
  nextLabel?: string
  /** Called when the user requests a different page. */
  onPageChange?: (page: number) => void
}

function integer(value: number, minimum: number, prop: string) {
  if (!Number.isSafeInteger(value) || value < minimum)
    throw new RangeError(`Ready Pagination: ${prop} must be a safe integer of at least ${minimum}.`)
  return value
}

export function paginationState(props: PaginationProps, local: number) {
  const count = integer(props.count, 0, 'count')
  const pageSize = integer(props.pageSize ?? 10, 1, 'pageSize')
  const page = integer(props.page ?? local, 1, props.page === undefined ? 'defaultPage' : 'page')
  const rootLabel = props.label
  const prevTriggerLabel = props.previousLabel ?? 'Previous'
  const nextTriggerLabel = props.nextLabel ?? 'Next'
  validateAccessibleText(rootLabel, 'Pagination', 'label')
  validateAccessibleText(prevTriggerLabel, 'Pagination', 'previousLabel')
  validateAccessibleText(nextTriggerLabel, 'Pagination', 'nextLabel')
  return {
    count,
    pageSize,
    page: Math.min(page, Math.max(1, Math.ceil(count / pageSize))),
    translations: { rootLabel, prevTriggerLabel, nextTriggerLabel },
  }
}
