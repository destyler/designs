import { useId, useMemo, useState } from 'react'
import { Combobox as Primitive, createListCollection, useFieldContext } from '@destyler-ui/react'
import { comboboxOptions, comboboxPosition, comboboxText, comboboxTranslations, filterCombobox, selectedCombobox, type ComboboxProps } from '../Combobox'
import { describeField } from '../switch-description'

export function Combobox(props: ComboboxProps) {
  const [local, setLocal] = useState(props.defaultValue ?? '')
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  const id = useId()
  const field = useFieldContext()
  const { label, emptyMessage } = comboboxText(props.label, props.emptyMessage)
  const description = describeField(id, props.description, undefined, field?.ariaDescribedby)
  const options = comboboxOptions(props.options)
  const selected = selectedCombobox(options, props.value ?? local)
  const items = useMemo(() => filterCombobox(options, query), [options, query])
  const collection = useMemo(() => createListCollection({ items }), [items])
  const value = useMemo(() => selected ? [selected.value] : [], [selected?.value])
  function change(keys: string[]) {
    const next = keys[0] ?? ''
    if (props.value === undefined) setLocal(next)
    setQuery(null)
    props.onValueChange?.(next)
  }
  return <div className="rd-component rd-combobox">
    <Primitive.Root collection={collection} value={value} inputValue={query ?? selected?.label ?? ''}
      highlightedValue={items.some(item => item.value === highlight) ? highlight : null}
      onHighlightChange={({ highlightedValue }) => setHighlight(highlightedValue)} disabled={props.disabled} placeholder={props.placeholder} selectionBehavior="preserve" positioning={comboboxPosition} translations={comboboxTranslations}
      onInputValueChange={details => setQuery(details.inputValue)} onValueChange={details => change(details.value)}
      onOpenChange={({ open: next }) => { setOpen(next); if (!next) setQuery(null) }}>
      <Primitive.Label>{label}</Primitive.Label>
      <Primitive.Control>
        <Primitive.Input aria-describedby={description.describedBy} />
        <Primitive.ClearTrigger tabIndex={0}><span aria-hidden="true">×</span></Primitive.ClearTrigger>
        <Primitive.Trigger><span aria-hidden="true">⌄</span></Primitive.Trigger>
      </Primitive.Control>
      <Primitive.Positioner>
        <Primitive.Content aria-label={label}>{items.map(item => <Primitive.Item key={item.value} item={item}>
          <Primitive.ItemText>{item.label}</Primitive.ItemText>
          <Primitive.ItemIndicator aria-hidden="true">✓</Primitive.ItemIndicator>
        </Primitive.Item>)}</Primitive.Content>
        {open && !items.length && <p role="status" aria-live="polite" className="rd-combobox-empty">{emptyMessage}</p>}
      </Primitive.Positioner>
    </Primitive.Root>
    {description.hasDescription && <p id={description.descriptionId} className="rd-description">{props.description}</p>}
  </div>
}
