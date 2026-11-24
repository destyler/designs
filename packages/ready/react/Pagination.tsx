import { Pagination as UI } from '@destyler-ui/react'
import { useEffect, useState } from 'react'
import { paginationState, type PaginationProps } from '../Pagination'

export function Pagination(props: PaginationProps) {
  const [local, setLocal] = useState(() => props.defaultPage ?? 1)
  const state = paginationState(props, local)
  useEffect(() => {
    if (props.page === undefined && local !== state.page) setLocal(state.page)
  }, [props.page, local, state.page])

  return (
    <UI.Root
      className="rd-component rd-pagination"
      count={state.count}
      pageSize={state.pageSize}
      page={state.page}
      translations={state.translations}
      onPageChange={({ page }) => {
        if (page === state.page) return
        if (props.page === undefined) setLocal(page)
        props.onPageChange?.(page)
      }}
    >
      <UI.PrevTrigger>{state.translations.prevTriggerLabel}</UI.PrevTrigger>
      <UI.Context>
        {(api) => api.pages.map((entry, index) =>
          entry.type === 'page'
            ? <UI.Item key={entry.value} {...entry}>{entry.value}</UI.Item>
            : <UI.Ellipsis key={`gap-${index}`} index={index} aria-hidden="true">…</UI.Ellipsis>
        )}
      </UI.Context>
      <UI.NextTrigger>{state.translations.nextTriggerLabel}</UI.NextTrigger>
    </UI.Root>
  )
}
