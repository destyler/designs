import { createRoot } from 'react-dom/client'
import { Menu } from '../../../packages/ready/react/Menu'
import { items, record } from './state'

createRoot(document.querySelector('#app')!).render(<main>
  <Menu trigger="Actions" items={items} onSelect={value => record('A', value)} onOpenChange={open => record('open', open)} />
  <button type="button" id="outside">Outside</button>
  <Menu trigger="Other actions" items={items} onSelect={value => record('B', value)} />
  <Menu trigger="No actions" items={[]} />
  <output data-results />
</main>)
