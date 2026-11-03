export type DemoExample = 'settings' | 'switch' | 'checkbox' | 'tabs' | 'dialog'

export const switchExamples = [
  { key: 'updates', label: 'Product updates', description: 'New features, delivered to your inbox.', checked: true, disabled: false },
  { key: 'marketing', label: 'Marketing emails', description: 'Occasional news and inspiration.', checked: false, disabled: false },
  { key: 'security', label: 'Security alerts', description: 'Always on to keep your account safe.', checked: true, disabled: true },
] as const

export const checkboxExamples = [
  { key: 'tips', label: 'Include helpful tips', description: 'Get more from the features you use.', checked: true, disabled: false },
  { key: 'newsletter', label: 'Monthly newsletter', description: 'A little inspiration, once a month.', checked: false, disabled: false },
  { key: 'required', label: 'Required account notices', description: 'Essential updates cannot be turned off.', checked: true, disabled: true },
] as const

export const tabExamples = [
  { value: 'account', label: 'Account', title: 'Your account', description: 'A space that feels like you.', detail: 'Your profile is visible to your workspace. Personal details stay private.', status: 'Profile visibility: workspace only' },
  { value: 'password', label: 'Password', title: 'Password & security', description: 'Keep your account protected.', detail: 'Use a unique password and enable two-step verification for extra peace of mind.', status: 'Two-step verification: enabled' },
  { value: 'team', label: 'Team', title: 'Your team', description: 'Good work happens together.', detail: 'Invite collaborators to share projects and keep everyone on the same page.', status: 'Workspace: 3 members' },
] as const
