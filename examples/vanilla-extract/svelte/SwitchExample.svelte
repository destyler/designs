<script lang="ts">
  import { Switch } from '@destyler-ui/svelte/switch'
  import { classes as c } from '@destyler/designs-vanilla-extract-poc'

  let checked = $state(false)
</script>

<Switch.Root {checked} onCheckedChange={details => { checked = details.checked }} class={c.switchRoot}>
  <Switch.Control class={c.switchControl}><Switch.Thumb class={c.switchThumb}/></Switch.Control>
  <Switch.HiddenInput role="switch" aria-label="Airplane mode"/>
</Switch.Root>
