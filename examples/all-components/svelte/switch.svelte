<script module lang="ts">
  import type { SwitchRootProps } from '@destyler-ui/svelte/switch'

  export interface BasicProps extends SwitchRootProps {}
</script>

<script lang="ts">
  import { Switch } from '@destyler-ui/svelte/switch'

  const props: BasicProps = $props()
</script>

<Switch.Root {...props}>
  <Switch.Control>
    <Switch.Thumb />
  </Switch.Control>
  <Switch.Label>Label</Switch.Label>
  <Switch.HiddenInput />
</Switch.Root>
