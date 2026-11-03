import { useId, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../vendor/shadcn/new-york-v4/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../vendor/shadcn/new-york-v4/ui/card'
import { Switch } from '../../../vendor/shadcn/new-york-v4/ui/switch'
import { Checkbox } from '../../../vendor/shadcn/new-york-v4/ui/checkbox'
import { Label } from '../../../vendor/shadcn/new-york-v4/ui/label'
import { Button } from '../../../vendor/shadcn/new-york-v4/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogHeader, DialogFooter } from '../../../vendor/shadcn/new-york-v4/ui/dialog'

export function ReferenceDemo({ dark }: { dark: boolean }) {
  const id = useId()
  const [marketing, setMarketing] = useState(false)
  const [updates, setUpdates] = useState(true)
  const [tips, setTips] = useState(true)
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
