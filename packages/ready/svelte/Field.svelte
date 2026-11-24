<script lang="ts">
  import { tick, untrack } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { Field as UI } from '@destyler-ui/svelte/field'
  import { fieldText, type FieldProps } from '../Field'

  const props: FieldProps = $props()
  const id = $props.id()
  const initial = untrack(() => props.defaultValue)
  const text = $derived(fieldText(id, props.label, props.description, props.error))

  async function oninput(event: Event & { currentTarget: HTMLInputElement }) {
    const input = event.currentTarget
    props.onValueChange?.(input.value)
    await tick()
    if (input.isConnected && props.value !== undefined) input.value = props.value
  }
</script>

<UI.Root class="rd-component rd-field" ids={text.ids} disabled={props.disabled} required={props.required}
  readOnly={props.readOnly} invalid={Boolean(text.error)}>
  <UI.Label>{text.label}</UI.Label>
  <UI.Input value={props.value ?? initial} defaultValue={initial} name={props.name} type={props.type} placeholder={props.placeholder}
    autocomplete={props.autoComplete as HTMLInputAttributes["autocomplete"]} aria-describedby={text.describedBy} {oninput} />
  {#if text.description}<UI.HelperText class="rd-description">{text.description}</UI.HelperText>{/if}
  {#if text.error}<UI.ErrorText class="rd-error">{text.error}</UI.ErrorText>{/if}
</UI.Root>
