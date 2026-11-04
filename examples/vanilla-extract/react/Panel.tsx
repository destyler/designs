import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Dialog, Switch } from '@destyler-ui/react'
import { overrides, scopeClass, styles, type Engine } from '../shared/styles'
export function Panel({ initialEngine, id, allowBaseline = true }: { initialEngine: Engine; id: string; allowBaseline?: boolean }) {
  const [engine, setEngine] = useState<Engine>(initialEngine)
  const [dark, setDark] = useState(false)
  const [override, setOverride] = useState(false)
  const [utility, setUtility] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const c = styles(engine)
  const theme = scopeClass(dark)
  const tokens = (override ? overrides : {}) as CSSProperties
  return <section data-panel={id} data-framework="react" data-engine={engine === 'vanilla-extract' ? 'vanilla' : 'tailwind'} data-theme={dark ? 'dark' : 'light'} className={`fixture-panel ${theme}`} style={tokens}>
    <h2>{engine === 'vanilla-extract' ? 'vanilla-extract' : 'Tailwind recipes'}</h2>
    <div className="fixture-hint">React primitives · same tokens, different CSS pipeline</div>
    <div className="fixture-controls">
      <label>Engine <select aria-label="Style engine" value={engine} onChange={event => setEngine(event.target.value as Engine)}><option value="vanilla-extract">vanilla-extract</option><option value="tailwind" disabled={!allowBaseline}>Tailwind baseline</option></select></label>
      <label><input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} />Dark</label>
      <label><input type="checkbox" checked={override} onChange={e => setOverride(e.target.checked)} />Token override</label>
      <label><input type="checkbox" checked={utility} onChange={e => setUtility(e.target.checked)} />UnoCSS override</label>
    </div>
    <div className="fixture-switches">
      {[{ label: 'Updates', checked: true, size: 'default', disabled: false }, { label: 'Small', checked: false, size: 'sm', disabled: false }, { label: 'Disabled', checked: true, size: 'default', disabled: true }].map(item => <Switch.Root key={item.label} defaultChecked={item.checked} disabled={item.disabled} className={c.switchRoot} data-size={item.size} data-case={item.label.toLowerCase()}>
        <Switch.Control className={c.switchControl} data-size={item.size}><Switch.Thumb className={c.switchThumb} data-size={item.size} /></Switch.Control>
        <Switch.Label className={c.switchLabel}>{item.label}</Switch.Label><Switch.HiddenInput role="switch" />
      </Switch.Root>)}
    </div>
    <p className="fixture-hint">Tab to a switch and press Space. Disabled stays unchanged.</p>
    <Dialog.Root>
      <Dialog.Trigger className={`${c.button} ${utility ? 'fixture-utility-override' : ''}`} data-action="open-dialog">Open dialog</Dialog.Trigger>
      {mounted && createPortal(<div className={`fixture-portal ${theme}`} style={tokens} data-portal-owner={id} data-engine={engine === 'vanilla-extract' ? 'vanilla' : 'tailwind'} data-theme={dark ? 'dark' : 'light'}>
        <Dialog.Backdrop className={c.dialogBackdrop} />
        <Dialog.Positioner className={c.dialogPositioner}>
          <Dialog.Content className={c.dialogContent} data-demo-dialog={id}>
            <div className={c.dialogHeader}><Dialog.Title className={c.dialogTitle}>Your preferences</Dialog.Title><Dialog.Description className={c.dialogDescription}>React body portal · {dark ? 'dark' : 'light'} · {override ? 'custom violet tokens' : 'default tokens'}</Dialog.Description></div>
            <p>This body portal receives the same theme class and explicit token overrides as its panel.</p>
            <p className="fixture-hint">Tab stays inside. Escape, ×, or Done closes and returns focus.</p>
            <Dialog.CloseTrigger className={c.dialogClose} aria-label="Close dialog">×</Dialog.CloseTrigger>
            <div className={c.dialogFooter}><Dialog.CloseTrigger className={c.button}>Done</Dialog.CloseTrigger></div>
          </Dialog.Content>
        </Dialog.Positioner>
      </div>, document.body)}
    </Dialog.Root>
    <div className="fixture-token">{engine === 'vanilla-extract' ? 'dist/index.js + dist/styles.css' : 'Existing recipes → precompiled Tailwind CSS'}<br />{override ? '--dy-primary: #7c3aed; --dy-radius: 1rem' : 'Scoped Zinc tokens · light / dark'}<br />{utility ? 'UnoCSS: square corners + 32px horizontal padding' : 'UnoCSS override off'}</div>
  </section>
}
