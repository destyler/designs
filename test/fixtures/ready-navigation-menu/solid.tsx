import { render } from 'solid-js/web'
import { NavigationMenu } from '../../../packages/ready/solid/NavigationMenu'
import { items, record } from './state'

render(() => <main>
  <NavigationMenu label="Main navigation" items={items} onValueChange={record} />
  <button type="button" id="outside">Outside nav</button>
  <output data-values />
</main>, document.querySelector('#app')!)
