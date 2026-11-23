import { createEffect, onCleanup } from 'solid-js'
import { Toast as Primitive, Toaster, createToaster } from '@destyler-ui/solid/toast'
import { bindToastHost, readyToastGroup, toastMessageView, type ToastProps } from '../Toast'
import { validateAccessibleText } from '../accessible-text'

export function Toast(props: ToastProps) {
  const toaster = createToaster(readyToastGroup)
  let host: HTMLDivElement | undefined
  createEffect(() => {
    const controller = props.controller
    if (host) onCleanup(bindToastHost(controller, toaster, host))
  })
  return <div class="rd-component rd-toast" ref={element => { host = element }}>
    <Toaster toaster={toaster} aria-label={validateAccessibleText(props.label ?? 'Notifications', 'Toast', 'label')} aria-atomic={false}>
      {options => {
        const message = toastMessageView(options().id, options().meta)
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
