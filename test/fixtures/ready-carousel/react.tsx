import { createRoot } from 'react-dom/client'
import { Carousel } from '../../../packages/ready/react/Carousel'
import { items, record } from './state'

createRoot(document.querySelector('#app')!).render(<main>
  <Carousel label="Stories" items={items} onPageChange={record} renderSlide={(item, index) => <a href={`#item-${index}`}>{item.content}</a>} />
  <Carousel label="Single" items={items.slice(0, 1)} />
  <Carousel label="Empty" items={[]} />
  <output data-pages />
</main>)
