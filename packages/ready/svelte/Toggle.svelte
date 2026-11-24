<script lang="ts">
  import { Toggle as Primitive } from '@destyler-ui/svelte/toggle'
  import { validateAccessibleText } from '../accessible-text'
  import type { ToggleProps } from '../Toggle'

  let { label, pressed, defaultPressed, disabled, onPressedChange }: ToggleProps = $props()
</script>

<div class="rd-component">
  <Primitive.Root {pressed} {defaultPressed} {disabled} {onPressedChange}>
    {validateAccessibleText(label, 'Toggle', 'label')}
  </Primitive.Root>
</div>
