<script lang="ts">
  import { onMount } from 'svelte'
  import { themes } from '@destyler/designs-vanilla-extract-poc'
  import { connectShowcase, initialShowcaseState } from '../shared/showcase'
  import SwitchExample from './SwitchExample.svelte'
  import DialogExample from './DialogExample.svelte'
  import '@fontsource-variable/geist'
  import '../shared/showcase.css'

  let view = $state(initialShowcaseState())
  onMount(() => connectShowcase(value => { view = value }))
  const theme = $derived(themes[view.theme])
</script>

<main class={`showcase-stage ${theme}`} data-framework="svelte" data-theme={view.theme}>
  {#if view.component === 'switch'}
    <SwitchExample/>
  {:else}
    <DialogExample colorMode={view.theme}/>
  {/if}
</main>
