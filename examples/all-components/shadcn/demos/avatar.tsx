// Demo composition is application code. Imports preserve original pinned shadcn source.
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york-v4/ui/avatar'
import { sampleImage } from '../sample-image'

export default function Example() {
  return <Avatar><AvatarImage src={sampleImage} alt="Avatar illustration" /><AvatarFallback>EL</AvatarFallback></Avatar>
}
