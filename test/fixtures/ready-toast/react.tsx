import { createRoot } from 'react-dom/client'
import { Toast } from '../../../packages/ready/react/Toast'
import { controller, expose } from './state'

const root = createRoot(document.querySelector('#app')!)
root.render(<main><button id="outside" type="button">Outside</button><Toast controller={controller} label="Activity" /><button id="after" type="button">After</button></main>)
expose(() => root.unmount())
