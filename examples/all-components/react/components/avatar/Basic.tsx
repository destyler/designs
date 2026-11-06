import { sampleImage } from '../../sample-image'
import { Avatar } from '@destyler-ui/react'

export function Basic(props: Avatar.RootProps = {}) {
  return (
    <Avatar.Root {...props}>
      <Avatar.Fallback>EH</Avatar.Fallback>
      <Avatar.Image src={sampleImage} alt="avatar" />
    </Avatar.Root>
  )
}
