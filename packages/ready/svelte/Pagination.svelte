<script lang="ts">
  import { Pagination as UI } from '@destyler-ui/svelte'
  import { paginationState, type PaginationProps } from '../Pagination'

  const props: PaginationProps = $props()
  let local = $state(initialPage())
  function initialPage() { return props.defaultPage ?? 1 }
  const view = $derived(paginationState(props, local))
  $effect(() => {
    if (props.page === undefined && local !== view.page) local = view.page
  })
  function change({ page }: { page: number }) {
    if (page === view.page) return
    if (props.page === undefined) local = page
    props.onPageChange?.(page)
  }
</script>

<UI.Root
  class="rd-component rd-pagination"
  count={view.count}
  pageSize={view.pageSize}
  page={view.page}
  translations={view.translations}
  onPageChange={change}
>
  <UI.PrevTrigger>{view.translations.prevTriggerLabel}</UI.PrevTrigger>
  <UI.Context>
    {#snippet render(api)}
      {#each api().pages as entry, index (entry.type === 'page' ? entry.value : `gap-${index}`)}
        {#if entry.type === 'page'}
          <UI.Item {...entry}>{entry.value}</UI.Item>
        {:else}
          <UI.Ellipsis {index} aria-hidden="true">…</UI.Ellipsis>
        {/if}
      {/each}
    {/snippet}
  </UI.Context>
  <UI.NextTrigger>{view.translations.nextTriggerLabel}</UI.NextTrigger>
</UI.Root>
