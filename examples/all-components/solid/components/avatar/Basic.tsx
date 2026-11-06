import { exampleImage } from '../../assets'
import { Avatar } from '@destyler-ui/solid/avatar'

export function Basic() {
  return (
    <Avatar.Root>
      <Avatar.Fallback>PA</Avatar.Fallback>
      <Avatar.Image src={exampleImage} alt="avatar" />
    </Avatar.Root>
  )
}
