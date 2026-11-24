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
          { value: 'default', title: 'Default' },
          { value: 'midnight', title: 'Midnight' },
        ],
      },
    },
  },
  initialGlobals: { readyTheme: 'default' },
  decorators: [
    (story, context) => {
      // Theme the actual Canvas document, so components portaled to body
      // inherit the same tokens as components mounted in the host.
      document.documentElement.dataset.rdTheme = context.globals.readyTheme === 'midnight' ? 'midnight' : 'default'
      return story()
    },
  ],
  parameters: { layout: 'centered' },
}

export default preview
