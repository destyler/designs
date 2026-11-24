<script lang="ts">
  import { Toast as Primitive, Toaster, createToaster } from '@destyler-ui/svelte/toast'
  import { bindToastHost, readyToastGroup, toastMessageView, type ToastProps } from '../Toast'
  import { validateAccessibleText } from '../accessible-text'

  let { controller, label = 'Notifications' }: ToastProps = $props()
  const toaster = createToaster(readyToastGroup)
  let host = $state<HTMLDivElement>()
  $effect(() => { if (host) return bindToastHost(controller, toaster, host) })
</script>

<div class="rd-component rd-toast" bind:this={host}>
  <Toaster {toaster} aria-label={validateAccessibleText(label, 'Toast', 'label')} aria-atomic={false}>
    {#snippet children(options)}
      {@const message = toastMessageView(options().id, options().meta)}
      <Primitive.Root role="group" aria-atomic={false} tabindex={-1}
        aria-labelledby={message.titleId} aria-describedby={message.descriptionId}>
        <div>
          <Primitive.Title>{message.title}</Primitive.Title>
          {#if message.description}<Primitive.Description>{message.description}</Primitive.Description>{/if}
        </div>
        <Primitive.CloseTrigger aria-label={message.closeLabel}><span aria-hidden="true">×</span></Primitive.CloseTrigger>
      </Primitive.Root>
    {/snippet}
  </Toaster>
</div>
