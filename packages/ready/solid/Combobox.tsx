import { createMemo, createSignal, createUniqueId, For, Show } from 'solid-js'
import { Combobox as Primitive, createListCollection } from '@destyler-ui/solid/combobox'
import { useFieldContext } from '@destyler-ui/solid/field'
import { comboboxOptions, comboboxPosition, comboboxText, comboboxTranslations, filterCombobox, selectedCombobox, type ComboboxProps } from '../Combobox'
import { describeField } from '../switch-description'

export function Combobox(props: ComboboxProps) {
  const [local, setLocal] = createSignal(props.defaultValue ?? '')
  const [query, setQuery] = createSignal<string | null>(null)
  const [open, setOpen] = createSignal(false)
  const [highlight, setHighlight] = createSignal<string | null>(null)
  const id = createUniqueId()
  const field = useFieldContext()
  const text = createMemo(() => comboboxText(props.label, props.emptyMessage))
  const description = createMemo(() => describeField(id, props.description, undefined, field?.()?.ariaDescribedby))
  const options = createMemo(() => comboboxOptions(props.options))
  const selected = createMemo(() => selectedCombobox(options(), props.value ?? local()))
  const items = createMemo(() => filterCombobox(options(), query()))
  const collection = createMemo(() => createListCollection({ items: items() }))
  const value = createMemo(() => selected() ? [selected()!.value] : [])
  function change(keys: string[]) {
    const next = keys[0] ?? ''
    if (props.value === undefined) setLocal(next)
    setQuery(null)
    props.onValueChange?.(next)
  }
  return <div class="rd-component rd-combobox">
    <Primitive.Root collection={collection()} value={value()} inputValue={query() ?? selected()?.label ?? ''}
      highlightedValue={items().some(item => item.value === highlight()) ? highlight() : null}
      onHighlightChange={({ highlightedValue }) => setHighlight(highlightedValue)} disabled={props.disabled} placeholder={props.placeholder} selectionBehavior="preserve" positioning={comboboxPosition} translations={comboboxTranslations}
      onInputValueChange={details => setQuery(details.inputValue)} onValueChange={details => change(details.value)}
      onOpenChange={({ open: next }) => { setOpen(next); if (!next) setQuery(null) }}>
      <Primitive.Label>{text().label}</Primitive.Label>
      <Primitive.Control>
        <Primitive.Input aria-describedby={description().describedBy} />
        <Primitive.ClearTrigger tabIndex={0}><span aria-hidden="true">×</span></Primitive.ClearTrigger>
        <Primitive.Trigger><span aria-hidden="true">⌄</span></Primitive.Trigger>
      </Primitive.Control>
      <Primitive.Positioner>
        <Primitive.Content aria-label={text().label}><For each={items()}>{item => <Primitive.Item item={item}>
          <Primitive.ItemText>{item.label}</Primitive.ItemText>
          <Primitive.ItemIndicator aria-hidden="true">✓</Primitive.ItemIndicator>
        </Primitive.Item>}</For></Primitive.Content>
        <Show when={open() && !items().length}><p role="status" aria-live="polite" class="rd-combobox-empty">{text().emptyMessage}</p></Show>
      </Primitive.Positioner>
    </Primitive.Root>
    <Show when={description().hasDescription}><p id={description().descriptionId} class="rd-description">{props.description}</p></Show>
  </div>
}
