<script lang="ts">
  import { untrack } from 'svelte'
  import { Combobox as Primitive, createListCollection } from '@destyler-ui/svelte/combobox'
  import { useFieldContext } from '@destyler-ui/svelte/field'
  import { comboboxOptions, comboboxPosition, comboboxText, comboboxTranslations, filterCombobox, selectedCombobox, type ComboboxProps } from '../Combobox'
  import { describeField } from '../switch-description'

  let { label, options, value, defaultValue, disabled, description, placeholder, emptyMessage, onValueChange }: ComboboxProps = $props()
  let local = $state(untrack(() => defaultValue ?? ''))
  let query = $state<string | null>(null)
  let open = $state(false)
  let highlight = $state<string | null>(null)
  const id = $props.id()
  const field = useFieldContext()
  const text = $derived(comboboxText(label, emptyMessage))
  const descriptionProps = $derived(describeField(id, description, undefined, field?.()?.ariaDescribedby))
  const validatedOptions = $derived(comboboxOptions(options))
  const selected = $derived(selectedCombobox(validatedOptions, value ?? local))
  const items = $derived(filterCombobox(validatedOptions, query))
  const collection = $derived(createListCollection({ items }))
  const valueKeys = $derived(selected ? [selected.value] : [])
  function change(keys: string[]) {
    const next = keys[0] ?? ''
    if (value === undefined) local = next
    query = null
    onValueChange?.(next)
  }
</script>

<div class="rd-component rd-combobox">
  <Primitive.Root {collection} value={valueKeys} inputValue={query ?? selected?.label ?? ''}
    highlightedValue={items.some(item => item.value === highlight) ? highlight : null}
    onHighlightChange={({ highlightedValue }) => highlight = highlightedValue} {disabled} {placeholder} selectionBehavior="preserve" positioning={comboboxPosition} translations={comboboxTranslations}
    onInputValueChange={details => query = details.inputValue} onValueChange={details => change(details.value)}
    onOpenChange={({ open: next }) => { open = next; if (!next) query = null }}>
    <Primitive.Label>{text.label}</Primitive.Label>
    <Primitive.Control>
      <Primitive.Input aria-describedby={descriptionProps.describedBy} />
      <Primitive.ClearTrigger tabindex={0}><span aria-hidden="true">×</span></Primitive.ClearTrigger>
      <Primitive.Trigger><span aria-hidden="true">⌄</span></Primitive.Trigger>
    </Primitive.Control>
    <Primitive.Positioner>
      <Primitive.Content aria-label={text.label}>
        {#each items as item (item.value)}
          <Primitive.Item {item}>
            <Primitive.ItemText>{item.label}</Primitive.ItemText>
            <Primitive.ItemIndicator aria-hidden="true">✓</Primitive.ItemIndicator>
          </Primitive.Item>
        {/each}
      </Primitive.Content>
      {#if open && !items.length}<p role="status" aria-live="polite" class="rd-combobox-empty">{text.emptyMessage}</p>{/if}
    </Primitive.Positioner>
  </Primitive.Root>
  {#if descriptionProps.hasDescription}<p id={descriptionProps.descriptionId} class="rd-description">{description}</p>{/if}
</div>
