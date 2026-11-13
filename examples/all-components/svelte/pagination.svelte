<script lang="ts">
  import { paginationItems } from './pagination-items'
  import { Pagination } from '@destyler-ui/svelte/pagination'
  let currentPage = $state(1)
</script>

<div class="parity-stack"><Pagination.Root page={currentPage} onPageChange={details => currentPage = details.page} count={100} pageSize={10} siblingCount={2}>
  <Pagination.PrevTrigger>Previous <span class="visually-hidden">Page</span></Pagination.PrevTrigger>
  <Pagination.Context>
    {#snippet render(pagination)}
      {#each paginationItems(pagination().page) as page, index}
        {#if page.type === 'page'}
          <Pagination.Item value={page.value} type={page.type}>{page.value}</Pagination.Item>
        {:else}
          <Pagination.Ellipsis {index}>&#8230;</Pagination.Ellipsis>
        {/if}
      {/each}
    {/snippet}
  </Pagination.Context>
  <Pagination.NextTrigger>Next <span class="visually-hidden">Page</span></Pagination.NextTrigger>
</Pagination.Root><p role="status" class="parity-status">Page {currentPage} of 10 · 100 items</p></div>
