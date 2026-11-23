import type { ReactNode } from 'react'
import { Label as Primitive } from '@destyler-ui/react'
import type { LabelProps } from '../Label'

export function Label({ htmlFor, children }: { htmlFor: LabelProps['for']; children?: ReactNode }) {
  return <Primitive.Root className="rd-component" htmlFor={htmlFor}>{children}</Primitive.Root>
}
