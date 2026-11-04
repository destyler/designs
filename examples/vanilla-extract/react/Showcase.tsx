import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Dialog, Switch } from '@destyler-ui/react'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState, notifications } from '../shared/showcase'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

export function Showcase() {
  const [view, setView] = useState(initialShowcaseState)
  const [checked, setChecked] = useState<Record<string, boolean>>({ updates: true, marketing: false, security: true })
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); return connectShowcase(setView) }, [])
  const theme = themes[view.theme]
  return <main className={`showcase-stage ${theme}`} data-framework="react" data-theme={view.theme}>
    {view.component === 'switch' ? <section className="showcase-card" aria-label="Notifications">
      <header className="showcase-heading"><h2>Notifications</h2><p>Choose what reaches your inbox.</p></header>
      <div className="showcase-stack">{notifications.map(item => <Switch.Root key={item.key} checked={checked[item.key]} onCheckedChange={details => setChecked(value => ({ ...value, [item.key]: details.checked }))} disabled={item.disabled} className={`${c.switchRoot} showcase-row ${item.disabled ? 'showcase-disabled' : ''}`} data-case={item.key}>
        <div className="showcase-copy"><Switch.Label className="showcase-label">{item.label}</Switch.Label><p className="showcase-description">{item.description}</p></div>
        <Switch.Control className={c.switchControl}><Switch.Thumb className={c.switchThumb}/></Switch.Control><Switch.HiddenInput role="switch"/>
      </Switch.Root>)}<p className="showcase-status" role="status">{Object.values(checked).filter(Boolean).length} of 3 notifications enabled.</p></div>
    </section> : <section className="showcase-card showcase-dialog-card" aria-label="Notification preferences">
      <header className="showcase-heading"><h2>Notification preferences</h2><p>A little less noise. The updates that matter.</p></header>
      <div className="showcase-stack">{[['Product updates', 'On'], ['Marketing emails', 'Off'], ['Helpful tips', 'On']].map(([label, value]) => <div className="showcase-row" key={label}><span className="showcase-label">{label}</span><span className="showcase-description">{value}</span></div>)}</div>
      <Dialog.Root><Dialog.Trigger className={`${c.button} showcase-open`}>Review preferences</Dialog.Trigger>
        {mounted && createPortal(<div className={`showcase-portal ${theme}`} data-portal-owner="react" data-theme={view.theme}>
          <Dialog.Backdrop className={c.dialogBackdrop}/><Dialog.Positioner className={c.dialogPositioner}><Dialog.Content className={c.dialogContent} data-demo-dialog="react">
            <div className={c.dialogHeader}><Dialog.Title className={c.dialogTitle}>Your preferences</Dialog.Title><Dialog.Description className={c.dialogDescription}>Demo only. No settings are sent or stored.</Dialog.Description></div>
            <p>Marketing: off · Updates: on · Tips: on</p>
            <div className={c.dialogFooter}><Dialog.CloseTrigger className={c.button}>Done</Dialog.CloseTrigger></div>
          </Dialog.Content></Dialog.Positioner>
        </div>, document.body)}
      </Dialog.Root>
    </section>}
  </main>
}
