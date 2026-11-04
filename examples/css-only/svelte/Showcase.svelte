<script lang="ts">
  import { onMount } from 'svelte'
  import { connectShowcase, initialShowcaseState } from '../shared/showcase'
  import SwitchExample from './SwitchExample.svelte'
  import DialogExample from './DialogExample.svelte'
  import '@fontsource-variable/geist'
  import '../shared/showcase.css'

  let view = $state(initialShowcaseState())
  onMount(() => connectShowcase(value => { view = value }))
</script>

<main data-showcase data-framework="svelte" data-theme={view.theme}>
  {#if view.component === 'switch'}
    <SwitchExample/>
  {:else}
    <DialogExample/>
  {/if}
</main>
