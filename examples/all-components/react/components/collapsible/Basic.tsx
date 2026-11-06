import { Collapsible } from '@destyler-ui/react'

export function Basic(props: Collapsible.RootProps = {}) {
  return (
    <Collapsible.Root {...props}>
      <Collapsible.Trigger>Toggle</Collapsible.Trigger>
      <Collapsible.Content>Content</Collapsible.Content>
    </Collapsible.Root>
  )
}
