import { useId, type ReactNode } from 'react'
import { Carousel as Primitive } from '@destyler-ui/react'
import { carouselPage, notifyCarouselPage, slideLabel, validateCarousel, type CarouselItem, type CarouselProps } from '../Carousel'

export function Carousel({ label, items, onPageChange, renderSlide }: CarouselProps & {
  renderSlide?: (item: CarouselItem, index: number) => ReactNode
}) {
  const rootId = useId()
  validateCarousel(label, items)
  if (!items.length) return null
  return <Primitive.Root className="rd-component rd-carousel" aria-label={label} ids={{ root: rootId }} slideCount={items.length}
    autoplay={false} loop={false} slidesPerPage={1}
    onPageChange={({ page }) => notifyCarouselPage(page, items.length, rootId, onPageChange)}>
    <Primitive.Context>{api => {
      const active = carouselPage(api.page, items.length)
      return <>
        <Primitive.ItemGroup aria-live="off">
          {items.map((item, index) => <Primitive.Item key={item.id} index={index} aria-label={slideLabel(item, index, items.length)}
            inert={active !== index} aria-hidden={active !== index}>
            {renderSlide ? renderSlide(item, index) : item.content ?? item.label}
          </Primitive.Item>)}
        </Primitive.ItemGroup>
        {items.length > 1 && <>
          <Primitive.Control>
            <Primitive.PrevTrigger disabled={false} aria-disabled={!api.canScrollPrev}
              onClick={event => { if (!api.canScrollPrev) event.preventDefault() }}>Previous</Primitive.PrevTrigger>
            <Primitive.IndicatorGroup role="group" aria-label="Choose a slide">
              {items.map((item, index) => <Primitive.Indicator key={item.id} index={index}
                tabIndex={active === index ? 0 : -1} aria-current={active === index || undefined}>{index + 1}</Primitive.Indicator>)}
            </Primitive.IndicatorGroup>
            <Primitive.NextTrigger disabled={false} aria-disabled={!api.canScrollNext}
              onClick={event => { if (!api.canScrollNext) event.preventDefault() }}>Next</Primitive.NextTrigger>
          </Primitive.Control>
          <p className="rd-carousel-status" role="status">Slide {active + 1} of {items.length}</p>
        </>}
      </>
    }}</Primitive.Context>
  </Primitive.Root>
}
