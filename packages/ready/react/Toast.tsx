import { useEffect, useRef, useState } from 'react'
import { Toast as Primitive, Toaster, createToaster } from '@destyler-ui/react'
import { bindToastHost, readyToastGroup, toastMessageView, type ToastProps } from '../Toast'
import { validateAccessibleText } from '../accessible-text'

export function Toast({ controller, label = 'Notifications' }: ToastProps) {
  const [toaster] = useState(() => createToaster(readyToastGroup))
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => bindToastHost(controller, toaster, host.current!), [controller, toaster])
  return <div className="rd-component rd-toast" ref={host}>
    <Toaster toaster={toaster} aria-label={validateAccessibleText(label, 'Toast', 'label')} aria-atomic={false}>
      {({ id, meta }) => {
        const message = toastMessageView(id, meta)
        return <Primitive.Root role="group" aria-atomic={false} tabIndex={-1}
          aria-labelledby={message.titleId} aria-describedby={message.descriptionId}>
          <div>
            <Primitive.Title>{message.title}</Primitive.Title>
            {message.description && <Primitive.Description>{message.description}</Primitive.Description>}
          </div>
          <Primitive.CloseTrigger aria-label={message.closeLabel}><span aria-hidden="true">×</span></Primitive.CloseTrigger>
        </Primitive.Root>
      }}
    </Toaster>
  </div>
}
