<script lang="ts">
  import Carousel from '../../../packages/ready/svelte/Carousel.svelte'
  import { items, record } from './state'
</script>

<main>
  <Carousel label="Stories" {items} onPageChange={record}>
    {#snippet slide(item, index)}
      <a href={`#item-${index}`}>{item.content}</a>
    {/snippet}
  </Carousel>
  <Carousel label="Single" items={items.slice(0, 1)} />
  <Carousel label="Empty" items={[]} />
  <output data-pages />
</main>
