import { render } from 'solid-js/web'
import { Menu } from '../../../packages/ready/solid/Menu'
import { items, record } from './state'

render(() => <main>
  <Menu trigger="Actions" items={items} onSelect={value => record('A', value)} onOpenChange={open => record('open', open)} />
  <button type="button" id="outside">Outside</button>
  <Menu trigger="Other actions" items={items} onSelect={value => record('B', value)} />
  <Menu trigger="No actions" items={[]} />
  <output data-results />
</main>, document.querySelector('#app')!)
