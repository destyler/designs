<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Fieldset as Primitive } from '@destyler-ui/svelte/fieldset'
  import { validateAccessibleText } from '../accessible-text'
  import type { FieldsetProps } from '../Fieldset'

  let { legend, description, disabled, children }: FieldsetProps & { children?: Snippet } = $props()
  const descriptionId = $props.id()
</script>

<Primitive.Root class="rd-component" {disabled} aria-describedby={description?.trim() ? descriptionId : undefined}>
  <Primitive.Legend>{validateAccessibleText(legend, 'Fieldset', 'legend')}</Primitive.Legend>
  {#if description?.trim()}<p id={descriptionId} class="rd-description">{description}</p>{/if}
  {@render children?.()}
</Primitive.Root>
