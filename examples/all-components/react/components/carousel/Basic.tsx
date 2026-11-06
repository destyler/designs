import { createSampleImage } from '../../sample-image'
import { Carousel } from '@destyler-ui/react'

const images = Array.from({ length: 5 }, (_, index) => createSampleImage(index))

export function Basic() {
  return (
    <Carousel.Root>
      <Carousel.Control>
        <Carousel.PrevTrigger>Previous</Carousel.PrevTrigger>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        <Carousel.AutoplayTrigger>
          <Carousel.Context>
            {context => (context.isPlaying ? 'Pause' : 'Play')}
          </Carousel.Context>
        </Carousel.AutoplayTrigger>
      </Carousel.Control>
      <Carousel.IndicatorGroup>
        {images.map((_, idx) => (
          <Carousel.Indicator key={idx} index={idx} />
        ))}
      </Carousel.IndicatorGroup>
      <Carousel.ItemGroup>
        {images.map((image, idx) => (
          <Carousel.Item key={idx} index={idx}>
            <img
              src={image}
              alt={`Landscape ${idx + 1}`}
              style={{ height: '300px', width: '100%', objectFit: 'cover' }}
            />
          </Carousel.Item>
        ))}
      </Carousel.ItemGroup>
    </Carousel.Root>
  )
}
