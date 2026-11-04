// @source-start: shared
import { useState } from 'react'
import {
  checkboxExamples,
  switchExamples,
  tabExamples,
  type DemoExample,
} from '../components/examples'
import { createPortal } from 'react-dom'
import { Checkbox, Dialog, Switch, Tabs } from '@destyler-ui/react'
import { CheckIcon } from 'lucide-react'
import { recipes as r } from '../styles/recipes'
// @source-end: shared

// @source-start: demo-setup
export function ReactDemo({
  dark,
  example = 'settings',
}: {
  dark: boolean
  example?: DemoExample
}) {
  // @source-end: demo-setup
  const [marketing, setMarketing] = useState(false)
  const [updates, setUpdates] = useState(true)
  const [tips, setTips] = useState(true)
  if (example === 'switch' || example === 'checkbox')
    return <ReactControls example={example} />
  // @source-start: tabs
  if (example === 'tabs')
    return (
      <Tabs.Root
        defaultValue="account"
        className={r.tabs + ' simple-demo w-full'}
      >
        <Tabs.List
          className={r['tabs-list'] + ' w-full'}
          data-variant="default"
        >
          {tabExamples.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={r['tabs-trigger']}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {tabExamples.map((tab) => (
          <Tabs.Content
            key={tab.value}
            value={tab.value}
            className={r['tabs-content']}
          >
            <div className={r.card + ' sample-card'} data-slot="card">
              <div className={r['card-header']}>
                <div className={r['card-title']}>{tab.title}</div>
                <div className={r['card-description']}>{tab.description}</div>
              </div>
              <div className={r['card-content']}>
                <p className="sample-description">{tab.detail}</p>
                <p className="sample-description sample-divider" role="status">
                  {tab.status}
                </p>
              </div>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    )
  // @source-end: tabs
  // @source-start: dialog
  if (example === 'dialog')
    return (
      <div
        className={r.card + ' simple-demo sample-card w-full'}
        data-slot="card"
      >
        <div className={r['card-header']}>
          <div className={r['card-title']}>Notification preferences</div>
          <div className={r['card-description']}>
            A little less noise. The updates that matter.
          </div>
        </div>
        <div className={r['card-content']}>
          <div className="sample-stack">
            <div className="sample-row">
              <span className="sample-label">Product updates</span>
              <span className="sample-description">On</span>
            </div>
            <div className="sample-row">
              <span className="sample-label">Marketing emails</span>
              <span className="sample-description">Off</span>
            </div>
            <div className="sample-row">
              <span className="sample-label">Helpful tips</span>
              <span className="sample-description">On</span>
            </div>
          </div>
        </div>
        <div className={r['card-footer']}>
          <Dialog.Root className="w-full">
            <Dialog.Trigger className={r.button + ' w-full'}>
              Review preferences
            </Dialog.Trigger>
            {createPortal(
              <div
                data-design="shadcn"
                className={dark ? 'dark' : ''}
                data-portal-owner="react"
              >
                <Dialog.Backdrop className={r['dialog-overlay']} />
                <Dialog.Positioner>
                  <Dialog.Content
                    data-demo-dialog="react"
                    className={r['dialog-content']}
                  >
                    <div className={r['dialog-header']}>
                      <Dialog.Title className={r['dialog-title']}>
                        Your preferences
                      </Dialog.Title>
                      <Dialog.Description className={r['dialog-description']}>
                        Demo only. No settings are sent or stored.
                      </Dialog.Description>
                    </div>
                    <p className="text-sm">
                      Marketing: off · Updates: on · Tips: on
                    </p>
                    <div className={r['dialog-footer']}>
                      <Dialog.CloseTrigger className={r.button}>
                        Done
                      </Dialog.CloseTrigger>
                    </div>
                  </Dialog.Content>
                </Dialog.Positioner>
              </div>,
              document.body,
            )}
          </Dialog.Root>
        </div>
      </div>
    )
  // @source-end: dialog
  return (
    <Tabs.Root defaultValue="notifications" className={r.tabs + ' w-full'}>
      <Tabs.List className={r['tabs-list'] + ' w-full'} data-variant="default">
        <Tabs.Trigger value="notifications" className={r['tabs-trigger']}>
          Notifications
        </Tabs.Trigger>
        <Tabs.Trigger value="security" className={r['tabs-trigger']}>
          Security
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="notifications" className={r['tabs-content']}>
        <div className={r.card} data-slot="card">
          <div className={r['card-header']}>
            <div className={r['card-title']}>Notifications</div>
            <div className={r['card-description']}>
              Choose what you want to hear about.
            </div>
          </div>
          <div className={r['card-content'] + ' grid gap-6'}>
            <Switch.Root
              checked={marketing}
              onCheckedChange={(d) => setMarketing(d.checked)}
              className="demo-row"
            >
              <div className="demo-row-copy">
                <Switch.Label className={r.label}>
                  Marketing emails
                </Switch.Label>
                <p className="demo-copy">
                  News, offers, and product inspiration.
                </p>
              </div>
              <Switch.Control data-size="default" className={r.switch}>
                <Switch.Thumb className={r['switch-thumb']} />
              </Switch.Control>
              <Switch.HiddenInput role="switch" />
            </Switch.Root>
            <Switch.Root
              checked={updates}
              onCheckedChange={(d) => setUpdates(d.checked)}
              className="demo-row"
            >
              <div className="demo-row-copy">
                <Switch.Label className={r.label}>Product updates</Switch.Label>
                <p className="demo-copy">New features and improvements.</p>
              </div>
              <Switch.Control data-size="default" className={r.switch}>
                <Switch.Thumb className={r['switch-thumb']} />
              </Switch.Control>
              <Switch.HiddenInput role="switch" />
            </Switch.Root>
            <Checkbox.Root
              checked={tips}
              onCheckedChange={(d) => setTips(d.checked === true)}
              className="flex items-center gap-3 border-t pt-5"
            >
              <Checkbox.Control className={r.checkbox}>
                <Checkbox.Indicator className={r['checkbox-indicator']}>
                  <CheckIcon className="size-3.5" />
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label className={r.label}>
                Include helpful tips
              </Checkbox.Label>
              <Checkbox.HiddenInput />
            </Checkbox.Root>
          </div>
          <div className={r['card-footer']}>
            <Dialog.Root className="w-full">
              <Dialog.Trigger className={r.button + ' w-full'}>
                Review preferences
              </Dialog.Trigger>
              {createPortal(
                <div
                  data-design="shadcn"
                  className={dark ? 'dark' : ''}
                  data-portal-owner="react"
                >
                  <Dialog.Backdrop className={r['dialog-overlay']} />
                  <Dialog.Positioner>
                    <Dialog.Content
                      data-demo-dialog="react"
                      className={r['dialog-content']}
                    >
                      <div className={r['dialog-header']}>
                        <Dialog.Title className={r['dialog-title']}>
                          Your preferences
                        </Dialog.Title>
                        <Dialog.Description className={r['dialog-description']}>
                          Demo only. No settings are sent or stored.
                        </Dialog.Description>
                      </div>
                      <p className="text-sm">
                        Marketing: {marketing ? 'on' : 'off'} · Updates:{' '}
                        {updates ? 'on' : 'off'} · Tips: {tips ? 'on' : 'off'}
                      </p>
                      <div className={r['dialog-footer']}>
                        <Dialog.CloseTrigger className={r.button}>
                          Done
                        </Dialog.CloseTrigger>
                      </div>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </div>,
                document.body,
              )}
            </Dialog.Root>
          </div>
        </div>
      </Tabs.Content>
      <Tabs.Content value="security" className={r['tabs-content']}>
        <div className={r.card} data-slot="card">
          <div className={r['card-header']}>
            <div className={r['card-title']}>Security</div>
            <div className={r['card-description']}>
              Important alerts are always enabled.
            </div>
          </div>
          <div className={r['card-content'] + ' grid gap-6'}>
            <Switch.Root checked disabled className="demo-row">
              <Switch.Label className={r.label}>Security alerts</Switch.Label>
              <Switch.Control data-size="default" className={r.switch}>
                <Switch.Thumb className={r['switch-thumb']} />
              </Switch.Control>
              <Switch.HiddenInput role="switch" />
            </Switch.Root>
            <Checkbox.Root checked disabled className="flex items-center gap-3">
              <Checkbox.Control className={r.checkbox}>
                <Checkbox.Indicator className={r['checkbox-indicator']}>
                  <CheckIcon className="size-3.5" />
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label className={r.label}>
                Required account notices
              </Checkbox.Label>
              <Checkbox.HiddenInput />
            </Checkbox.Root>
            <p className="demo-notice">
              These controls demonstrate the disabled state.
            </p>
          </div>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  )
}

// @source-start: controls-setup
function ReactControls({ example }: { example: 'switch' | 'checkbox' }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    updates: true,
    marketing: false,
    security: true,
    tips: true,
    newsletter: false,
    required: true,
  })
  const items = example === 'switch' ? switchExamples : checkboxExamples
  // @source-end: controls-setup
  return (
    <div className="simple-demo sample-stack w-full">
      {items.map((item) =>
        example === 'switch' ? (
          // @source-start: switch
          <Switch.Root
            key={item.key}
            checked={checked[item.key]}
            disabled={item.disabled}
            onCheckedChange={(detail) =>
              setChecked((current) => ({
                ...current,
                [item.key]: detail.checked,
              }))
            }
            className={'sample-row' + (item.disabled ? ' sample-disabled' : '')}
          >
            <div className="demo-row-copy">
              <Switch.Label className={r.label + ' sample-label'}>
                {item.label}
              </Switch.Label>
              <p className="sample-description">{item.description}</p>
            </div>
            <Switch.Control data-size="default" className={r.switch}>
              <Switch.Thumb className={r['switch-thumb']} />
            </Switch.Control>
            <Switch.HiddenInput role="switch" />
          </Switch.Root>
          // @source-end: switch
        ) : (
          // @source-start: checkbox
          <Checkbox.Root
            key={item.key}
            checked={checked[item.key]}
            disabled={item.disabled}
            onCheckedChange={(detail) =>
              setChecked((current) => ({
                ...current,
                [item.key]: detail.checked === true,
              }))
            }
            className={'sample-row' + (item.disabled ? ' sample-disabled' : '')}
          >
            <Checkbox.Control className={r.checkbox}>
              <Checkbox.Indicator className={r['checkbox-indicator']}>
                <CheckIcon className="size-3.5" />
              </Checkbox.Indicator>
            </Checkbox.Control>
            <div className="demo-row-copy">
              <Checkbox.Label className={r.label + ' sample-label'}>
                {item.label}
              </Checkbox.Label>
              <p className="sample-description">{item.description}</p>
            </div>
            <Checkbox.HiddenInput />
          </Checkbox.Root>
          // @source-end: checkbox
        ),
      )}
      <p className="sample-description sample-divider" role="status">
        {items.filter((item) => checked[item.key]).length} of 3{' '}
        {example === 'switch' ? 'notifications enabled' : 'options selected'}.

      </p>
    </div>
  )
}
