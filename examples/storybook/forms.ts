import type {
  AspectRatioProps, AvatarProps, BreadcrumbsProps, CarouselProps, CheckboxProps,
  CollapseProps, CollapsibleProps, DialogProps, FieldProps, FieldsetProps,
} from '../../packages/ready/types'
import type { CalendarProps } from '../../packages/ready/Calendar'
import type { ClipboardProps } from '../../packages/ready/Clipboard'
import type { ColorPickerProps } from '../../packages/ready/ColorPicker'
import type { ComboboxProps } from '../../packages/ready/Combobox'
import type { DynamicProps } from '../../packages/ready/Dynamic'
import type { Demo } from './demo-types'
import type { EditProps } from '../../packages/ready/Edit'

type Fixture<Props> = { args: Props; child?: Demo['child']; wide?: true }

export const forms = {
  AspectRatio: { args: { ratio: 16 / 9 }, child: 'Widescreen 16:9' },
  Avatar: { args: { alt: 'Ada Lovelace' } },
  Breadcrumbs: {
    args: {
      label: 'Project navigation',
      items: [
        { label: 'Workspace', href: '#workspace' },
        { label: 'Projects', href: '#projects' },
        { label: 'Design system' },
      ],
    },
  },
  Calendar: {
    args: {
      label: 'Release date',
      defaultValue: '2026-05-15',
      disabledDates: ['2026-05-16', '2026-05-17'],
      locale: 'en-US',
    },
    wide: true,
  },
  Carousel: {
    args: {
      label: 'Workspace tour',
      items: [
        { id: 'overview', label: 'Overview', content: '1 · Start with your workspace overview.' },
        { id: 'invite', label: 'Invite teammates', content: '2 · Invite the people you work with.' },
        { id: 'launch', label: 'Launch a project', content: '3 · Start your first project.' },
      ],
    },
    wide: true,
  },
  Checkbox: {
    args: {
      label: 'Email me product updates',
      description: 'You can unsubscribe at any time.',
      name: 'product-updates',
    },
  },
  Clipboard: {
    args: { label: 'Workspace reference', value: 'design-system-demo' },
  },
  Collapse: {
    args: {
      items: [
        { value: 'getting-started', label: 'Getting started', content: 'Install Ready and import a component for your framework.' },
        { value: 'themes', label: 'Themes', content: 'Use the shared Ready theme or customize its tokens.' },
        { value: 'next', label: 'Coming soon', content: 'This section is unavailable.', disabled: true },
      ],
      defaultValue: ['getting-started'],
      collapsible: true,
    },
  },
  Collapsible: {
    args: { trigger: 'Advanced settings' },
    child: 'These settings apply only to this workspace.',
  },
  ColorPicker: {
    args: { label: 'Accent color', defaultValue: '#2563EB', presets: ['#2563EB', '#7C3AED', '#0F766E'] },
  },
  Combobox: {
    args: {
      label: 'Assignee',
      placeholder: 'Search people',
      options: [
        { label: 'Ada Lovelace', value: 'ada' },
        { label: 'Grace Hopper', value: 'grace' },
        { label: 'Katherine Johnson', value: 'katherine' },
        { label: 'Alan Turing (unavailable)', value: 'alan', disabled: true },
      ],
    },
  },
  Dialog: {
    args: {
      trigger: 'Review settings',
      title: 'Workspace settings',
      description: 'Review the settings before returning to your workspace.',
    },
    child: 'Only workspace owners can change these settings.',
  },
  Dynamic: {
    args: { label: 'Project tags', defaultValue: ['Design', 'Accessibility'], maxTags: 5, name: 'tags' },
  },
  Edit: {
    args: { label: 'Project name', defaultValue: 'Design system', maxLength: 40 },
  },
  Field: {
    args: {
      label: 'Work email',
      type: 'email',
      name: 'email',
      autoComplete: 'email',
      placeholder: 'name@example.com',
      description: 'Used for workspace invitations.',
      required: true,
    },
  },
  Fieldset: {
    args: { legend: 'Contact preferences', description: 'Manage how this workspace contacts you.' },
    child: { component: 'Field', args: { label: 'Notification email', type: 'email', name: 'notifications' } },
  },
} satisfies {
  AspectRatio: Fixture<AspectRatioProps>
  Avatar: Fixture<AvatarProps>
  Breadcrumbs: Fixture<BreadcrumbsProps>
  Calendar: Fixture<CalendarProps>
  Carousel: Fixture<CarouselProps>
  Checkbox: Fixture<CheckboxProps>
  Clipboard: Fixture<ClipboardProps>
  Collapse: Fixture<CollapseProps>
  Collapsible: Fixture<CollapsibleProps>
  ColorPicker: Fixture<ColorPickerProps>
  Combobox: Fixture<ComboboxProps>
  Dialog: Fixture<DialogProps>
  Dynamic: Fixture<DynamicProps>
  Edit: Fixture<EditProps>
  Field: Fixture<FieldProps>
  Fieldset: Fixture<FieldsetProps>
}
