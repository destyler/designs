import { createRoot } from 'react-dom/client'
import { Example } from './Example'
import { Showcase } from './Showcase'
import '../shared/fixture.css'
const showcase = new URLSearchParams(location.search).has('showcase')
const target = document.querySelector('#app')!
if (showcase) document.body.replaceChildren(target)
else void import('../shared/fixture')
createRoot(target).render(showcase ? <Showcase /> : <Example />)
