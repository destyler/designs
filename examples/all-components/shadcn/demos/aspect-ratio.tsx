// Demo composition is application code. Imports preserve original pinned shadcn source.
import { AspectRatio } from '@/registry/new-york-v4/ui/aspect-ratio'
import { sampleImage } from '../sample-image'

export default function Example() {
  return <div className="w-full max-w-sm"><AspectRatio ratio={16 / 9}><img src={sampleImage} alt="Geometric illustration" className="h-full w-full rounded-md object-cover" /></AspectRatio></div>
}
