<script module lang="ts">
  import type { CheckboxRootProps } from '@destyler-ui/svelte/checkbox'

  export interface BasicProps extends CheckboxRootProps {}
</script>

<script lang="ts">
  import { Checkbox } from '@destyler-ui/svelte/checkbox'

  const props: BasicProps = $props()
</script>

<Checkbox.Root {...props}>
  <Checkbox.Label>Checkbox</Checkbox.Label>
  <Checkbox.Control>
    <Checkbox.Indicator>x</Checkbox.Indicator>
  </Checkbox.Control>
  <Checkbox.HiddenInput />
</Checkbox.Root>
