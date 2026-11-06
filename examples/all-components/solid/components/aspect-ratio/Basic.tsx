import { exampleImage } from '../../assets'
import { AspectRatio } from '@destyler-ui/solid/aspect-ratio'

export function Basic() {
  return (
    <main style={{ width: '300px' }}>
      <AspectRatio.Root ratio={16 / 9}>
        <AspectRatio.Content>
          <img
            src={exampleImage}
            alt="Abstract blue mountain landscape"
            style={{ 'width': '100%', 'height': '100%', 'object-fit': 'cover' }}
          />
        </AspectRatio.Content>
      </AspectRatio.Root>
    </main>
  )
}
