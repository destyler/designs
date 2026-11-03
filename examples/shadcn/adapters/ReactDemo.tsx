import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Checkbox, Dialog, Switch, Tabs } from '@destyler-ui/react'
import { CheckIcon } from 'lucide-react'
import { recipes as r } from '../styles/recipes'

export function ReactDemo({ dark }: { dark: boolean }) {
  const [marketing, setMarketing] = useState(false)
  const [updates, setUpdates] = useState(true)
  const [tips, setTips] = useState(true)
  return <Tabs.Root defaultValue="notifications" className={r.tabs+' w-full'}>
    <Tabs.List className={r['tabs-list']+' w-full'} data-variant="default"><Tabs.Trigger value="notifications" className={r['tabs-trigger']}>Notifications</Tabs.Trigger><Tabs.Trigger value="security" className={r['tabs-trigger']}>Security</Tabs.Trigger></Tabs.List>
    <Tabs.Content value="notifications" className={r['tabs-content']}>
      <div className={r.card} data-slot="card"><div className={r['card-header']}><div className={r['card-title']}>Notifications</div><div className={r['card-description']}>Choose what you want to hear about.</div></div>
        <div className={r['card-content']+' grid gap-6'}>
          <Switch.Root checked={marketing} onCheckedChange={d=>setMarketing(d.checked)} className="demo-row"><div className="demo-row-copy"><Switch.Label className={r.label}>Marketing emails</Switch.Label><p className="demo-copy">News, offers, and product inspiration.</p></div><Switch.Control data-size="default" className={r.switch}><Switch.Thumb className={r['switch-thumb']}/></Switch.Control><Switch.HiddenInput role="switch"/></Switch.Root>
          <Switch.Root checked={updates} onCheckedChange={d=>setUpdates(d.checked)} className="demo-row"><div className="demo-row-copy"><Switch.Label className={r.label}>Product updates</Switch.Label><p className="demo-copy">New features and improvements.</p></div><Switch.Control data-size="default" className={r.switch}><Switch.Thumb className={r['switch-thumb']}/></Switch.Control><Switch.HiddenInput role="switch"/></Switch.Root>
          <Checkbox.Root checked={tips} onCheckedChange={d=>setTips(d.checked === true)} className="flex items-center gap-3 border-t pt-5"><Checkbox.Control className={r.checkbox}><Checkbox.Indicator className={r['checkbox-indicator']}><CheckIcon className="size-3.5"/></Checkbox.Indicator></Checkbox.Control><Checkbox.Label className={r.label}>Include helpful tips</Checkbox.Label><Checkbox.HiddenInput/></Checkbox.Root>
        </div>
        <div className={r['card-footer']}><Dialog.Root className="w-full"><Dialog.Trigger className={r.button+' w-full'}>Review preferences</Dialog.Trigger>
          {createPortal(<div data-design="shadcn" className={dark ? 'dark' : ''} data-portal-owner="react"><Dialog.Backdrop className={r['dialog-overlay']}/><Dialog.Positioner><Dialog.Content data-demo-dialog="react" className={r['dialog-content']}><div className={r['dialog-header']}><Dialog.Title className={r['dialog-title']}>Your preferences</Dialog.Title><Dialog.Description className={r['dialog-description']}>Demo only. No settings are sent or stored.</Dialog.Description></div><p className="text-sm">Marketing: {marketing ? 'on' : 'off'} · Updates: {updates ? 'on' : 'off'} · Tips: {tips ? 'on' : 'off'}</p><div className={r['dialog-footer']}><Dialog.CloseTrigger className={r.button}>Done</Dialog.CloseTrigger></div></Dialog.Content></Dialog.Positioner></div>,document.body)}
        </Dialog.Root></div>
      </div>
    </Tabs.Content>
    <Tabs.Content value="security" className={r['tabs-content']}><div className={r.card} data-slot="card"><div className={r['card-header']}><div className={r['card-title']}>Security</div><div className={r['card-description']}>Important alerts are always enabled.</div></div><div className={r['card-content']+' grid gap-6'}><Switch.Root checked disabled className="demo-row"><Switch.Label className={r.label}>Security alerts</Switch.Label><Switch.Control data-size="default" className={r.switch}><Switch.Thumb className={r['switch-thumb']}/></Switch.Control><Switch.HiddenInput role="switch"/></Switch.Root><Checkbox.Root checked disabled className="flex items-center gap-3"><Checkbox.Control className={r.checkbox}><Checkbox.Indicator className={r['checkbox-indicator']}><CheckIcon className="size-3.5"/></Checkbox.Indicator></Checkbox.Control><Checkbox.Label className={r.label}>Required account notices</Checkbox.Label><Checkbox.HiddenInput/></Checkbox.Root><p className="demo-notice">These controls demonstrate the disabled state.</p></div></div></Tabs.Content>
  </Tabs.Root>
}
