import { render } from 'solid-js/web'
import { Toast } from '../../../packages/ready/solid/Toast'
import { controller, expose } from './state'

expose(render(() => <main><button id="outside" type="button">Outside</button>
  <Toast controller={controller} label="Activity" /><button id="after" type="button">After</button></main>, document.querySelector('#app')!))
