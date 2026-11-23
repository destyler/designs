import { render } from 'solid-js/web'
import { Carousel } from '../../../packages/ready/solid/Carousel'
import { items, record } from './state'

render(() => <main>
  <Carousel label="Stories" items={items} onPageChange={record} renderSlide={(item, index) => <a href={`#item-${index}`}>{item.content}</a>} />
  <Carousel label="Single" items={items.slice(0, 1)} />
  <Carousel label="Empty" items={[]} />
  <output data-pages />
</main>, document.querySelector('#app')!)
