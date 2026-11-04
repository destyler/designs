import { createSignal, createMemo, onMount, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { Dialog } from '@destyler-ui/solid/dialog'
import { Switch } from '@destyler-ui/solid/switch'
import { overrides, scopeClass, styles, type Engine } from '../shared/styles'
export function Panel({ initialEngine, id, allowBaseline = true }: { initialEngine: Engine; id: string; allowBaseline?: boolean }) {
  const [engine, setEngine] = createSignal<Engine>(initialEngine)
  const [dark, setDark] = createSignal(false)
  const [override, setOverride] = createSignal(false)
  const [utility, setUtility] = createSignal(false)
  const [mounted, setMounted] = createSignal(false)
  onMount(() => setMounted(true))
  const c = createMemo(() => styles(engine()))
  const theme = createMemo(() => scopeClass(dark()))
  const tokens = createMemo(() => override() ? overrides : {})
  return <section data-panel={id} data-framework="solid" data-engine={engine() === 'vanilla-extract' ? 'vanilla' : 'tailwind'} data-theme={dark() ? 'dark' : 'light'} class={`fixture-panel ${theme()}`} style={tokens()}>
    <h2>{engine() === 'vanilla-extract' ? 'vanilla-extract' : 'Tailwind recipes'}</h2>
    <div class="fixture-hint">Solid primitives · same tokens, different CSS pipeline</div>
    <div class="fixture-controls">
      <label>Engine <select aria-label="Style engine" value={engine()} onChange={event => setEngine(event.currentTarget.value as Engine)}><option value="vanilla-extract">vanilla-extract</option><option value="tailwind" disabled={!allowBaseline}>Tailwind baseline</option></select></label>
      <label><input type="checkbox" checked={dark()} onChange={e => setDark(e.currentTarget.checked)} />Dark</label>
      <label><input type="checkbox" checked={override()} onChange={e => setOverride(e.currentTarget.checked)} />Token override</label>
      <label><input type="checkbox" checked={utility()} onChange={e => setUtility(e.currentTarget.checked)} />UnoCSS override</label>
    </div>
    <div class="fixture-switches">
      {[{ label: 'Updates', checked: true, size: 'default', disabled: false }, { label: 'Small', checked: false, size: 'sm', disabled: false }, { label: 'Disabled', checked: true, size: 'default', disabled: true }].map(item => <Switch.Root defaultChecked={item.checked} disabled={item.disabled} class={c().switchRoot} data-size={item.size} data-case={item.label.toLowerCase()}>
        <Switch.Control class={c().switchControl} data-size={item.size}><Switch.Thumb class={c().switchThumb} data-size={item.size} /></Switch.Control>
        <Switch.Label class={c().switchLabel}>{item.label}</Switch.Label><Switch.HiddenInput role="switch" />
      </Switch.Root>)}
    </div>
    <p class="fixture-hint">Tab to a switch and press Space. Disabled stays unchanged.</p>
    <Dialog.Root>
      <Dialog.Trigger class={`${c().button} ${utility() ? 'fixture-utility-override' : ''}`} data-action="open-dialog">Open dialog</Dialog.Trigger>
      <Show when={mounted()}><Portal><div class={`fixture-portal ${theme()}`} style={tokens()} data-portal-owner={id} data-engine={engine() === 'vanilla-extract' ? 'vanilla' : 'tailwind'} data-theme={dark() ? 'dark' : 'light'}>
        <Dialog.Backdrop class={c().dialogBackdrop} />
        <Dialog.Positioner class={c().dialogPositioner}>
          <Dialog.Content class={c().dialogContent} data-demo-dialog={id}>
            <div class={c().dialogHeader}><Dialog.Title class={c().dialogTitle}>Your preferences</Dialog.Title><Dialog.Description class={c().dialogDescription}>Solid body portal · {dark() ? 'dark' : 'light'} · {override() ? 'custom violet tokens' : 'default tokens'}</Dialog.Description></div>
            <p>This body portal receives the same theme class and explicit token overrides as its panel.</p>
            <p class="fixture-hint">Tab stays inside. Escape, ×, or Done closes and returns focus.</p>
            <Dialog.CloseTrigger class={c().dialogClose} aria-label="Close dialog">×</Dialog.CloseTrigger>
            <div class={c().dialogFooter}><Dialog.CloseTrigger class={c().button}>Done</Dialog.CloseTrigger></div>
          </Dialog.Content>
        </Dialog.Positioner>
      </div></Portal></Show>
    </Dialog.Root>
    <div class="fixture-token">{engine() === 'vanilla-extract' ? 'dist/index.js + dist/styles.css' : 'Existing recipes → precompiled Tailwind CSS'}<br />{override() ? '--dy-primary: #7c3aed; --dy-radius: 1rem' : 'Scoped Zinc tokens · light / dark'}<br />{utility() ? 'UnoCSS: square corners + 32px horizontal padding' : 'UnoCSS override off'}</div>
  </section>
}
