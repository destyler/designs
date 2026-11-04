<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { Dialog } from '@destyler-ui/svelte/dialog'
  import { Switch } from '@destyler-ui/svelte/switch'
  import { overrides, scopeClass, styles, type Engine } from '../shared/styles'
  let { initialEngine, id, allowBaseline = true }: { initialEngine: Engine; id: string; allowBaseline?: boolean } = $props()
  let engine = $state<Engine>(untrack(() => initialEngine))
  let dark = $state(false)
  let override = $state(false)
  let utility = $state(false)
  let mounted = $state(false)
  onMount(() => { mounted = true })
  const c = $derived(styles(engine))
  const theme = $derived(scopeClass(dark))
  const tokens = $derived(override ? Object.entries(overrides).map(([key, value]) => `${key}:${value}`).join(';') : '')
  const switches = [{ label: 'Updates', checked: true, size: 'default', disabled: false }, { label: 'Small', checked: false, size: 'sm', disabled: false }, { label: 'Disabled', checked: true, size: 'default', disabled: true }]
  // Actions run only in the browser. The mount guard also keeps portal content
  // absent from server HTML and the first hydration render.
  function bodyPortal(node: HTMLElement) {
    document.body.appendChild(node)
    return { destroy() { node.remove() } }
  }
</script>

<section data-panel={id} data-framework="svelte" data-engine={engine === 'vanilla-extract' ? 'vanilla' : 'tailwind'} data-theme={dark ? 'dark' : 'light'} class={`fixture-panel ${theme}`} style={tokens}>
  <h2>{engine === 'vanilla-extract' ? 'vanilla-extract' : 'Tailwind recipes'}</h2>
  <div class="fixture-hint">Svelte primitives · same tokens, different CSS pipeline</div>
  <div class="fixture-controls">
    <label>Engine <select aria-label="Style engine" bind:value={engine}><option value="vanilla-extract">vanilla-extract</option><option value="tailwind" disabled={!allowBaseline}>Tailwind baseline</option></select></label>
    <label><input type="checkbox" bind:checked={dark} />Dark</label>
    <label><input type="checkbox" bind:checked={override} />Token override</label>
    <label><input type="checkbox" bind:checked={utility} />UnoCSS override</label>
  </div>
  <div class="fixture-switches">
    {#each switches as item (item.label)}
      <Switch.Root defaultChecked={item.checked} disabled={item.disabled} class={c.switchRoot} data-size={item.size} data-case={item.label.toLowerCase()}>
        <Switch.Control class={c.switchControl} data-size={item.size}><Switch.Thumb class={c.switchThumb} data-size={item.size} /></Switch.Control>
        <Switch.Label class={c.switchLabel}>{item.label}</Switch.Label><Switch.HiddenInput role="switch" />
      </Switch.Root>
    {/each}
  </div>
  <p class="fixture-hint">Tab to a switch and press Space. Disabled stays unchanged.</p>
  <Dialog.Root>
    <Dialog.Trigger class={`${c.button} ${utility ? 'fixture-utility-override' : ''}`} data-action="open-dialog">Open dialog</Dialog.Trigger>
    {#if mounted}
      <div use:bodyPortal class={`fixture-portal ${theme}`} style={tokens} data-portal-owner={id} data-engine={engine === 'vanilla-extract' ? 'vanilla' : 'tailwind'} data-theme={dark ? 'dark' : 'light'}>
        <Dialog.Backdrop class={c.dialogBackdrop} />
        <Dialog.Positioner class={c.dialogPositioner}>
          <Dialog.Content class={c.dialogContent} data-demo-dialog={id}>
            <div class={c.dialogHeader}><Dialog.Title class={c.dialogTitle}>Your preferences</Dialog.Title><Dialog.Description class={c.dialogDescription}>Svelte body portal · {dark ? 'dark' : 'light'} · {override ? 'custom violet tokens' : 'default tokens'}</Dialog.Description></div>
            <p>This body portal receives the same theme class and explicit token overrides as its panel.</p>
            <p class="fixture-hint">Tab stays inside. Escape, ×, or Done closes and returns focus.</p>
            <Dialog.CloseTrigger class={c.dialogClose} aria-label="Close dialog">×</Dialog.CloseTrigger>
            <div class={c.dialogFooter}><Dialog.CloseTrigger class={c.button}>Done</Dialog.CloseTrigger></div>
          </Dialog.Content>
        </Dialog.Positioner>
      </div>
    {/if}
  </Dialog.Root>
  <div class="fixture-token">{engine === 'vanilla-extract' ? 'dist/index.js + dist/styles.css' : 'Existing recipes → precompiled Tailwind CSS'}<br />{override ? '--dy-primary: #7c3aed; --dy-radius: 1rem' : 'Scoped Zinc tokens · light / dark'}<br />{utility ? 'UnoCSS: square corners + 32px horizontal padding' : 'UnoCSS override off'}</div>
</section>
