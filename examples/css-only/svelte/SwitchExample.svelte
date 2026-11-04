<script lang="ts">
  import '@destyler/designs-css-only-poc/styles.css'
  import { Switch } from '@destyler-ui/svelte/switch'

  let checked = $state(false)
</script>

<Switch.Root {checked} onCheckedChange={details => { checked = details.checked }}>
  <Switch.Control><Switch.Thumb/></Switch.Control>
  <Switch.HiddenInput role="switch" aria-label="Airplane mode"/>
</Switch.Root>
