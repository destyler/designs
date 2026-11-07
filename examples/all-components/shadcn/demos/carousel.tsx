// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/registry/new-york-v4/ui/carousel'
import { makeSampleImage } from '../sample-image'

export default function Example() {
  return <div className="w-full max-w-sm px-12"><Carousel><CarouselContent>{['4f46e5', '0f766e', 'be123c', 'b45309', '7e22ce'].map((color, index) => <CarouselItem key={color}><img src={makeSampleImage(color)} alt={`Slide ${index + 1}`} className="aspect-video w-full rounded-md object-cover" /></CarouselItem>)}</CarouselContent><CarouselPrevious /><CarouselNext /></Carousel></div>
}
