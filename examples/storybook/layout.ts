import type { SignatureProps } from '../../packages/ready/Signature'
import type { SliderProps } from '../../packages/ready/Slider'
import type { SplitterProps } from '../../packages/ready/Splitter'
import type { StepsProps } from '../../packages/ready/Steps'
import type { TabsProps } from '../../packages/ready/Tabs.types'
import type { TimerProps } from '../../packages/ready/Timer'
import type { ToastMessage, ToastProps } from '../../packages/ready/Toast'
import type { ToggleProps } from '../../packages/ready/Toggle'
import type { ToggleGroupProps } from '../../packages/ready/ToggleGroup'
import type { TooltipProps } from '../../packages/ready/Tooltip'
import type { TourProps } from '../../packages/ready/Tour'
import type { TreeProps } from '../../packages/ready/Tree'
import type { SwitchProps } from '../../packages/ready/types'

export const layout = {
  Signature: { args: { label: 'Signature' } satisfies SignatureProps, wide: true },
  Slider: { args: { label: 'Brightness', min: 0, max: 100, step: 5, defaultValue: 50 } satisfies SliderProps, wide: true },
  Splitter: {
    args: { label: 'Files', defaultSize: 35, step: 5 } satisfies SplitterProps,
    slots: { first: 'Files and folders', second: 'Selected file details' },
    wide: true,
  },
  Steps: {
    args: {
      label: 'Account setup',
      items: [
        { id: 'profile', label: 'Profile', description: 'Add your name.' },
        { id: 'preferences', label: 'Preferences', description: 'Choose how you work.' },
        { id: 'review', label: 'Review', description: 'Check your settings.' },
      ],
    } satisfies StepsProps,
  },
  Switch: {
    args: { label: 'Email notifications', description: 'Receive a weekly activity summary.' } satisfies SwitchProps,
  },
  Tabs: {
    args: {
      label: 'Workspace',
      items: [
        { value: 'overview', label: 'Overview', content: 'See recent activity.' },
        { value: 'members', label: 'Members', content: 'Manage workspace members.' },
        { value: 'billing', label: 'Billing', disabled: true },
      ],
    } satisfies TabsProps,
    wide: true,
  },
  Timer: { args: { label: 'Elapsed time' } satisfies TimerProps },
  Toast: {
    args: { label: 'Notifications' } satisfies Omit<ToastProps, 'controller'>,
    action: {
      label: 'Show notification',
      message: { title: 'Settings saved', description: 'Your preferences are up to date.', tone: 'success' } satisfies ToastMessage,
    },
  },
  Toggle: { args: { label: 'Pin item' } satisfies ToggleProps },
  ToggleGroup: {
    args: {
      label: 'Text formatting',
      items: [{ value: 'bold', label: 'Bold' }, { value: 'italic', label: 'Italic' }, { value: 'underline', label: 'Underline' }],
      defaultValue: ['bold'],
    } satisfies ToggleGroupProps,
  },
  Tooltip: { args: { trigger: 'Archive', text: 'Move this item out of your inbox.' } satisfies TooltipProps },
  Tour: {
    args: {
      label: 'Start workspace tour',
      steps: [
        { id: 'projects', title: 'Find your projects', description: 'All your projects are in the workspace.' },
        { id: 'invite', title: 'Invite teammates', description: 'Share a workspace with the people you work with.' },
      ],
    } satisfies TourProps,
  },
  Tree: {
    args: {
      label: 'Workspace files',
      items: [
        { value: 'documents', label: 'Documents', children: [{ value: 'guide', label: 'Guide.md' }, { value: 'notes', label: 'Notes.md' }] },
        { value: 'assets', label: 'Assets', children: [{ value: 'logo', label: 'Logo.svg' }] },
      ],
      defaultExpandedValue: ['documents'],
    } satisfies TreeProps,
  },
} as const
