import type { TourStepDetails } from '@destyler-ui/solid/tour'

// Targets are resolved only when the tour runs in the browser. No network is used.
export const steps: TourStepDetails[] = [
  {
    type: 'dialog',
    id: 'welcome',
    title: 'Welcome to the component tour',
    description: 'Follow three short steps. You can dismiss and restart this tour.',
    actions: [{ label: 'Next', action: 'next' }],
  },
  ...[1, 2, 3].map((number): TourStepDetails => ({
    type: 'tooltip',
    id: `step-${number}`,
    title: `Step ${number}`,
    description: ['Explore the components.', 'Try their keyboard and pointer interactions.', 'Build accessible interfaces.'][number - 1],
    target: () => document.querySelector<HTMLElement>(`#step-${number}`),
    actions: [
      { label: 'Previous', action: 'prev' },
      { label: number === 3 ? 'Finish' : 'Next', action: number === 3 ? 'dismiss' : 'next' },
    ],
  })),
]
