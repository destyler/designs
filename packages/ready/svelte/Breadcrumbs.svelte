<script lang="ts">
  import { Breadcrumbs as Primitive } from '@destyler-ui/svelte/breadcrumbs'
  import { prepareBreadcrumbs } from '../Breadcrumbs'
  import type { BreadcrumbsItem, BreadcrumbsProps } from '../Breadcrumbs'

  let { items, label = 'Breadcrumb', separator = '/', onNavigate }:
    BreadcrumbsProps & { onNavigate?: (event: MouseEvent, item: BreadcrumbsItem) => void } = $props()
  const trail = $derived(prepareBreadcrumbs(items))
</script>

<div class="rd-component">
  <Primitive.Root items={trail} aria-label={label}>
    <Primitive.List>
      {#each trail as item, index (item.id)}
        <Primitive.Item {item} aria-label={undefined}>
          {#if index > 0}<Primitive.Separator>{separator}</Primitive.Separator>{/if}
          <Primitive.Link {item} onclick={event => { if (item.href) onNavigate?.(event, item.source) }}>
            {item.label}
          </Primitive.Link>
        </Primitive.Item>
      {/each}
    </Primitive.List>
  </Primitive.Root>
</div>
