import type { PresenceProps } from '@destyler-ui/react'
import { useState } from 'react'
import { Presence } from '@destyler-ui/react'

export function Basic(props: PresenceProps = {}) {
  const [present, setPresent] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setPresent(!present)}>
        Toggle
      </button>
      <Presence present={present} {...props} data-testid="box">
        I am a red box
      </Presence>
    </>
  )
}
