import { render } from 'solid-js/web'
import { Example } from './Example'
import { Showcase } from './Showcase'
import '../shared/fixture.css'
const showcase = new URLSearchParams(location.search).has('showcase')
const target = document.querySelector('#app')!
if (showcase) document.body.replaceChildren(target)
else void import('../shared/fixture')
render(() => showcase ? <Showcase /> : <Example />, target)
