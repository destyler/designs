import { sampleImage } from '../../sample-image'
import { AspectRatio } from '@destyler-ui/react'

export function Basic() {
  return (
    <main style={{ width: '300px' }}>
      <AspectRatio.Root ratio={16 / 9}>
        <AspectRatio.Content>
          <img
            src={sampleImage}
            alt="Sunrise over a mountain landscape"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </AspectRatio.Content>
      </AspectRatio.Root>
    </main>
  )
}
