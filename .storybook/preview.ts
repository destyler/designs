import type { Preview } from '@storybook/html-vite'
import '../packages/ready/theme.css'
import '../examples/storybook/canvas.css'

const preview: Preview = {
  globalTypes: {
    readyTheme: {
      description: 'Destyler Ready theme',
      toolbar: {
        title: 'Ready theme',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'shadcn', title: 'Shadcn' },
          { value: 'default', title: 'Default' },
          { value: 'midnight', title: 'Midnight' },
        ],
      },
    },
  },
  initialGlobals: { readyTheme: 'shadcn' },
  decorators: [
    (story, context) => {
      // Theme the actual Canvas document, so components portaled to body
      // inherit the same tokens as components mounted in the host.
      const theme = context.globals.readyTheme
      document.documentElement.dataset.rdTheme = theme === 'default' || theme === 'midnight' ? theme : 'shadcn'
      return story()
    },
  ],
  parameters: { layout: 'centered' },
}

export default preview
