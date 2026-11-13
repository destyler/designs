<script lang="ts">
  import { tick } from 'svelte'
  import { Select, createListCollection } from '@destyler-ui/svelte/select'
  type Option = { label: string; value: string; disabled?: boolean }
  let { label, options, value, name, placeholder = 'Choose an option', disabled = false, onValueChange }: { label: string; options: Option[]; value?: string; name?: string; placeholder?: string; disabled?: boolean; onValueChange?: (value: string) => void } = $props()
  let local = $state('')
  let element: HTMLDivElement
  function change(value: string) {
    local = value; onValueChange?.(value)
    void tick().then(() => setTimeout(syncHidden, 0))
  }
  const current = $derived(value ?? local)
  function syncHidden() {
    const value = current
    const select = element?.querySelector('select')
    if (!select?.isConnected) return
    for (const option of select.options) option.toggleAttribute('selected', option.value === value)
    select.value = value
  }
  $effect(() => { current; options.map(item => item.value); const timer = setTimeout(syncHidden, 0); return () => clearTimeout(timer) })
  const collection = $derived(createListCollection({ items: options }))
</script>
<div bind:this={element} class="rd-component"><Select.Root {collection} {name} value={current ? [current] : []} {disabled} onValueChange={details => change(details.value[0] ?? '')}>
  <Select.Label>{label}</Select.Label><Select.Control><Select.Trigger><Select.ValueText {placeholder} /><Select.Indicator aria-hidden="true">⌄</Select.Indicator></Select.Trigger></Select.Control>
  <Select.Positioner><Select.Content>{#each options as item (item.value)}<Select.Item {item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator></Select.Item>{/each}</Select.Content></Select.Positioner><Select.HiddenSelect />
</Select.Root></div>
