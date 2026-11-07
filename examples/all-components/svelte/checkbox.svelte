<script module lang="ts">
  import type { CheckboxRootProps } from '@destyler-ui/svelte/checkbox'

  export interface BasicProps extends CheckboxRootProps {}
</script>

<script lang="ts">
  import { Checkbox } from '@destyler-ui/svelte/checkbox'

  const props: BasicProps = $props()
</script>

<Checkbox.Root {...props}>
  <Checkbox.Control>
    <Checkbox.Indicator><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4" /></svg></Checkbox.Indicator>
  </Checkbox.Control>
  <Checkbox.Label>Checkbox</Checkbox.Label>
  <Checkbox.HiddenInput />
</Checkbox.Root>
