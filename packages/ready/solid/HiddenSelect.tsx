import { For, Show } from 'solid-js';
import { useSelectContext, useFieldContext } from '@destyler-ui/solid';
// Native select defaultValue does not serialize selected options in Solid SSR.
// Keep the primitive's single native control, attributes and focus/reset wiring.
export function HiddenSelect(props:{errorId?:string;emptyId?:string;invalid?:boolean}) {
 const select = useSelectContext();
 const field = useFieldContext();
 return <select {...select().getHiddenSelectProps()} aria-invalid={(props.invalid??field?.().invalid)||undefined} aria-describedby={[field?.().ariaDescribedby,props.errorId,props.emptyId].filter(Boolean).join(' ')||undefined}>
  <Show when={!select().collection.items.some(item=>select().value.includes(select().collection.getItemValue(item) ?? ''))}><option value="" selected /></Show>
  <For each={select().collection.items}>{item => <option
   value={select().collection.getItemValue(item) ?? ''}
   disabled={select().collection.getItemDisabled(item)}
   selected={select().value.includes(select().collection.getItemValue(item) ?? '')}
  >{select().collection.stringifyItem(item)}</option>}</For>
 </select>;
}
