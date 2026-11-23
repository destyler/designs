import { createRoot } from 'react-dom/client'
import { NavigationMenu } from '../../../packages/ready/react/NavigationMenu'
import { items, record } from './state'

createRoot(document.querySelector('#app')!).render(<main>
  <NavigationMenu label="Main navigation" items={items} onValueChange={record} />
  <button type="button" id="outside">Outside nav</button>
  <output data-values />
</main>)
