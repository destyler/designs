import { createMemo, createUniqueId, For, Show, type JSX } from 'solid-js'
import { Carousel as Primitive } from '@destyler-ui/solid/carousel'
import { carouselPage, notifyCarouselPage, slideLabel, validateCarousel, type CarouselItem, type CarouselProps } from '../Carousel'

export function Carousel(props: CarouselProps & { renderSlide?: (item: CarouselItem, index: number) => JSX.Element }) {
  const rootId = createUniqueId()
  const items = createMemo(() => validateCarousel(props.label, props.items))
  return <Show when={items().length > 0}>
    <Primitive.Root class="rd-component rd-carousel" aria-label={props.label} ids={{ root: rootId }} slideCount={items().length}
      autoplay={false} loop={false} slidesPerPage={1}
      onPageChange={({ page }) => notifyCarouselPage(page, items().length, rootId, props.onPageChange)}>
      <Primitive.Context>{api => {
        const active = createMemo(() => carouselPage(api().page, items().length))
        return <>
          <Primitive.ItemGroup aria-live="off">
            <For each={items()}>{(item, index) => <Primitive.Item index={index()} aria-label={slideLabel(item, index(), items().length)}
              inert={active() !== index()} aria-hidden={active() !== index()}>
              {props.renderSlide ? props.renderSlide(item, index()) : item.content ?? item.label}
            </Primitive.Item>}</For>
          </Primitive.ItemGroup>
          <Show when={items().length > 1}>
            <Primitive.Control>
              <Primitive.PrevTrigger disabled={false} aria-disabled={!api().canScrollPrev}
                onClick={event => { if (!api().canScrollPrev) event.preventDefault() }}>Previous</Primitive.PrevTrigger>
              <Primitive.IndicatorGroup role="group" aria-label="Choose a slide">
                <For each={items()}>{(_, index) => <Primitive.Indicator index={index()}
                  tabIndex={active() === index() ? 0 : -1} aria-current={active() === index() || undefined}>{index() + 1}</Primitive.Indicator>}</For>
              </Primitive.IndicatorGroup>
              <Primitive.NextTrigger disabled={false} aria-disabled={!api().canScrollNext}
                onClick={event => { if (!api().canScrollNext) event.preventDefault() }}>Next</Primitive.NextTrigger>
            </Primitive.Control>
            <p class="rd-carousel-status" role="status">Slide {active() + 1} of {items().length}</p>
          </Show>
        </>
      }}</Primitive.Context>
    </Primitive.Root>
  </Show>
}
