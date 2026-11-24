import { Pagination as UI } from '@destyler-ui/solid'
import { For, createEffect, createMemo, createSignal } from 'solid-js'
import { paginationState, type PaginationProps } from '../Pagination'

export function Pagination(props: PaginationProps) {
  const [local, setLocal] = createSignal(props.defaultPage ?? 1)
  const state = createMemo(() => paginationState(props, local()))
  createEffect(() => {
    if (props.page === undefined && local() !== state().page) setLocal(state().page)
  })

  return (
    <UI.Root
      class="rd-component rd-pagination"
      count={state().count}
      pageSize={state().pageSize}
      page={state().page}
      translations={state().translations}
      onPageChange={({ page }) => {
        if (page === state().page) return
        if (props.page === undefined) setLocal(page)
        props.onPageChange?.(page)
      }}
    >
      <UI.PrevTrigger>{state().translations.prevTriggerLabel}</UI.PrevTrigger>
      <UI.Context>
        {(api) => <For each={api().pages.map((entry, index) =>
          entry.type === 'page' ? entry.value : `gap-${index}`
        )}>{(entry, index) =>
          typeof entry === 'number'
            ? <UI.Item type="page" value={entry}>{entry}</UI.Item>
            : <UI.Ellipsis index={index()} aria-hidden="true">…</UI.Ellipsis>
        }</For>}
      </UI.Context>
      <UI.NextTrigger>{state().translations.nextTriggerLabel}</UI.NextTrigger>
    </UI.Root>
  )
}
