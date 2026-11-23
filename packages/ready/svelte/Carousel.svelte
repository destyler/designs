<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Carousel as Primitive } from '@destyler-ui/svelte/carousel'
  import { carouselPage, notifyCarouselPage, slideLabel, validateCarousel, type CarouselItem, type CarouselProps } from '../Carousel'

  let { label, items, onPageChange, slide }: CarouselProps & { slide?: Snippet<[CarouselItem, number]> } = $props()
  const rootId = $props.id()
  const slides = $derived(validateCarousel(label, items))
</script>

{#if slides.length}
  <Primitive.Root class="rd-component rd-carousel" aria-label={label} ids={{ root: rootId }} slideCount={slides.length}
    autoplay={false} loop={false} slidesPerPage={1}
    onPageChange={({ page }) => notifyCarouselPage(page, slides.length, rootId, onPageChange)}>
    <Primitive.Context>
      {#snippet render(api)}
        {@const active = carouselPage(api().page, slides.length)}
        <Primitive.ItemGroup aria-live="off">
          {#each slides as item, index (item.id)}
            <Primitive.Item {index} aria-label={slideLabel(item, index, slides.length)}
              inert={active !== index} aria-hidden={active !== index}>
              {#if slide}{@render slide(item, index)}{:else}{item.content ?? item.label}{/if}
            </Primitive.Item>
          {/each}
        </Primitive.ItemGroup>
        {#if slides.length > 1}
          <Primitive.Control>
            <Primitive.PrevTrigger disabled={false} aria-disabled={!api().canScrollPrev}
              onclick={event => { if (!api().canScrollPrev) event.preventDefault() }}>Previous</Primitive.PrevTrigger>
            <Primitive.IndicatorGroup role="group" aria-label="Choose a slide">
              {#each slides as item, index (item.id)}
                <Primitive.Indicator {index} tabindex={active === index ? 0 : -1}
                  aria-current={active === index || undefined}>{index + 1}</Primitive.Indicator>
              {/each}
            </Primitive.IndicatorGroup>
            <Primitive.NextTrigger disabled={false} aria-disabled={!api().canScrollNext}
              onclick={event => { if (!api().canScrollNext) event.preventDefault() }}>Next</Primitive.NextTrigger>
          </Primitive.Control>
          <p class="rd-carousel-status" role="status">Slide {active + 1} of {slides.length}</p>
        {/if}
      {/snippet}
    </Primitive.Context>
  </Primitive.Root>
{/if}
