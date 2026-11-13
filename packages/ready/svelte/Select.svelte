<script lang="ts">
  import { validateAccessibleText } from '../accessible-text'
  import { useFieldContext } from '@destyler-ui/svelte/field'
  import HiddenSelect from './HiddenSelect.svelte'
  import { tick } from 'svelte'
  import { Select, createListCollection } from '@destyler-ui/svelte/select'
  import type { Option } from '../types'
  import { validateSelectOptions } from '../select-options'
  let { label, options, value, name, required, error, placeholder = 'Choose an option', disabled, onValueChange }: { label: string; options: Option[]; value?: string; name?: string; required?: boolean; error?: string; placeholder?: string; disabled?: boolean; onValueChange?: (value: string) => void } = $props()
  let local = $state('')
  let element: HTMLDivElement
  const errorId=$props.id();const field=useFieldContext()
  const describedBy=$derived([field?.()?.ariaDescribedby,error?errorId:undefined].filter(Boolean).join(' ')||undefined)
  $effect(()=>{element?.querySelector('select')?.setCustomValidity(error??'')})
  function change(value: string) {
    local = value; onValueChange?.(value)
    void tick().then(() => setTimeout(syncHidden, 0))
  }
  const requested = $derived(value ?? local)
  // Normalize only the native control; the primitive retains the requested reset baseline.
  const current = $derived(options.some(item => item.value === requested) ? requested : '')
  function syncHidden() {
    const value = current
    const select = element?.querySelector('select')
    if (!select?.isConnected) return
    for (const option of select.options) option.toggleAttribute('selected', option.value === value)
    select.value = value
  }
  $effect(() => { current; options.map(item => item.value); const timer = setTimeout(syncHidden, 0); return () => clearTimeout(timer) })
  const collection = $derived(createListCollection({ items: validateSelectOptions(options) }))
  const accessibleLabel=$derived(validateAccessibleText(label,'Select','label'))
</script>
<div bind:this={element} class="rd-component"><Select.Root {required} invalid={error?true:(field?.()?.invalid??false)} {collection} {name} value={requested ? [requested] : []} {disabled} onValueChange={details => change(details.value[0] ?? '')}>
  <Select.Label>{accessibleLabel}</Select.Label><Select.Control><Select.Trigger data-placeholder-shown={current?undefined:''} aria-required={(required??field?.()?.required)||undefined} aria-describedby={describedBy}><Select.ValueText {placeholder} /><Select.Indicator aria-hidden="true">⌄</Select.Indicator></Select.Trigger></Select.Control>
  <Select.Positioner><Select.Content>{#each options as item (item.value)}<Select.Item {item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator></Select.Item>{/each}</Select.Content></Select.Positioner><HiddenSelect errorId={error?errorId:undefined} invalid={error?true:(field?.()?.invalid??false)} />
</Select.Root>{#if error}<span id={errorId} class="rd-error">{error}</span>{/if}</div>
