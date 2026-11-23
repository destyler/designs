import { createUniqueId, Show, type JSX } from 'solid-js'
import { Fieldset as Primitive } from '@destyler-ui/solid/fieldset'
import { validateAccessibleText } from '../accessible-text'
import type { FieldsetProps } from '../Fieldset'

export function Fieldset(props: FieldsetProps & { children?: JSX.Element }) {
  const descriptionId = createUniqueId()
  return <Primitive.Root class="rd-component" disabled={props.disabled} aria-describedby={props.description?.trim() ? descriptionId : undefined}>
    <Primitive.Legend>{validateAccessibleText(props.legend, 'Fieldset', 'legend')}</Primitive.Legend>
    <Show when={props.description?.trim()}><p id={descriptionId} class="rd-description">{props.description}</p></Show>
    {props.children}
  </Primitive.Root>
}
