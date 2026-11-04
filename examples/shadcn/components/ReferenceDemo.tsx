import { useId, useState } from 'react'
import { checkboxExamples, switchExamples, tabExamples, type DemoExample } from './examples'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../vendor/shadcn/new-york-v4/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../vendor/shadcn/new-york-v4/ui/card'
import { Switch } from '../../../vendor/shadcn/new-york-v4/ui/switch'
import { Checkbox } from '../../../vendor/shadcn/new-york-v4/ui/checkbox'
import { Label } from '../../../vendor/shadcn/new-york-v4/ui/label'
import { Button } from '../../../vendor/shadcn/new-york-v4/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader, DialogFooter } from '../../../vendor/shadcn/new-york-v4/ui/dialog'

export function ReferenceDemo({ dark, example = 'settings' }: { dark: boolean; example?: DemoExample }) {
  const id = useId()
  const [marketing, setMarketing] = useState(false)
  const [updates, setUpdates] = useState(true)
  const [tips, setTips] = useState(true)
  if (example === 'switch' || example === 'checkbox') return <ReferenceControls example={example}/>
  if (example === 'tabs') return <Tabs defaultValue="account" className="simple-demo w-full">
    <TabsList className="w-full">{tabExamples.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}</TabsList>
    {tabExamples.map(tab => <TabsContent key={tab.value} value={tab.value}><Card className="sample-card"><CardHeader><CardTitle>{tab.title}</CardTitle><CardDescription>{tab.description}</CardDescription></CardHeader><CardContent><p className="sample-description">{tab.detail}</p><p className="sample-description sample-divider" role="status">{tab.status}</p></CardContent></Card></TabsContent>)}
  </Tabs>
  if (example === 'dialog') return <Card className="simple-demo sample-card w-full"><CardHeader><CardTitle>Notification preferences</CardTitle><CardDescription>A little less noise. The updates that matter.</CardDescription></CardHeader><CardContent><div className="sample-stack"><div className="sample-row"><span className="sample-label">Product updates</span><span className="sample-description">On</span></div><div className="sample-row"><span className="sample-label">Marketing emails</span><span className="sample-description">Off</span></div><div className="sample-row"><span className="sample-label">Helpful tips</span><span className="sample-description">On</span></div></div></CardContent><CardFooter><Dialog><DialogTrigger asChild><Button className="w-full">Review preferences</Button></DialogTrigger><DialogContent data-design="shadcn" data-demo-dialog="reference" data-portal-owner="reference" className={dark ? 'dark' : ''} showCloseButton={false}><DialogHeader><DialogTitle>Your preferences</DialogTitle><DialogDescription>Demo only. No settings are sent or stored.</DialogDescription></DialogHeader><p className="text-sm">Marketing: off · Updates: on · Tips: on</p><DialogFooter><DialogClose asChild><Button>Done</Button></DialogClose></DialogFooter></DialogContent></Dialog></CardFooter></Card>
  return <Tabs defaultValue="notifications" className="w-full">
    <TabsList className="w-full"><TabsTrigger value="notifications">Notifications</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>
    <TabsContent value="notifications">
      <Card><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Choose what you want to hear about.</CardDescription></CardHeader>
        <CardContent className="grid gap-6">
          <div className="demo-row"><div className="demo-row-copy"><Label htmlFor={`${id}-marketing`}>Marketing emails</Label><p className="demo-copy">News, offers, and product inspiration.</p></div><Switch id={`${id}-marketing`} checked={marketing} onCheckedChange={setMarketing}/></div>
          <div className="demo-row"><div className="demo-row-copy"><Label htmlFor={`${id}-updates`}>Product updates</Label><p className="demo-copy">New features and improvements.</p></div><Switch id={`${id}-updates`} checked={updates} onCheckedChange={setUpdates}/></div>
          <div className="flex items-center gap-3 border-t pt-5"><Checkbox id={`${id}-tips`} checked={tips} onCheckedChange={v=>setTips(v === true)}/><Label htmlFor={`${id}-tips`}>Include helpful tips</Label></div>
        </CardContent>
        <CardFooter><Dialog><DialogTrigger asChild><Button className="w-full">Review preferences</Button></DialogTrigger>
          <DialogContent data-design="shadcn" data-demo-dialog="reference" className={dark ? 'dark' : ''} showCloseButton={false}>
            <DialogHeader><DialogTitle>Your preferences</DialogTitle><DialogDescription>Demo only. No settings are sent or stored.</DialogDescription></DialogHeader>
            <p className="text-sm">Marketing: {marketing ? 'on' : 'off'} · Updates: {updates ? 'on' : 'off'} · Tips: {tips ? 'on' : 'off'}</p>
            <DialogFooter><DialogClose asChild><Button>Done</Button></DialogClose></DialogFooter>
          </DialogContent>
        </Dialog></CardFooter>
      </Card>
    </TabsContent>
    <TabsContent value="security"><Card><CardHeader><CardTitle>Security</CardTitle><CardDescription>Important alerts are always enabled.</CardDescription></CardHeader><CardContent className="grid gap-6"><div className="demo-row"><Label htmlFor={`${id}-security`}>Security alerts</Label><Switch id={`${id}-security`} checked disabled/></div><div className="flex items-center gap-3"><Checkbox id={`${id}-required`} checked disabled/><Label htmlFor={`${id}-required`}>Required account notices</Label></div><p className="demo-notice">These controls demonstrate the disabled state.</p></CardContent></Card></TabsContent>
  </Tabs>
}

function ReferenceControls({ example }: { example: 'switch' | 'checkbox' }) {
  const id = useId()
  const [checked, setChecked] = useState<Record<string, boolean>>({ updates: true, marketing: false, security: true, tips: true, newsletter: false, required: true })
  const items = example === 'switch' ? switchExamples : checkboxExamples
  return <div className="simple-demo sample-stack w-full">{items.map(item => <div key={item.key} className={'sample-row' + (item.disabled ? ' sample-disabled' : '')}>
    {example === 'checkbox' && <Checkbox id={`${id}-${item.key}`} checked={checked[item.key]} disabled={item.disabled} onCheckedChange={value => setChecked(current => ({ ...current, [item.key]: value === true }))}/>}
    <div className="demo-row-copy"><Label className="sample-label" htmlFor={`${id}-${item.key}`}>{item.label}</Label><p className="sample-description">{item.description}</p></div>
    {example === 'switch' && <Switch id={`${id}-${item.key}`} checked={checked[item.key]} disabled={item.disabled} onCheckedChange={value => setChecked(current => ({ ...current, [item.key]: value }))}/>}
  </div>)}<p className="sample-description sample-divider" role="status">{items.filter(item => checked[item.key]).length} of 3 {example === 'switch' ? 'notifications enabled' : 'options selected'}.</p></div>
}
