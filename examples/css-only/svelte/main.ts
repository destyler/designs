import { mount } from 'svelte'
import Example from './Example.svelte'
import Showcase from './Showcase.svelte'
import '../shared/fixture.css'
const showcase = new URLSearchParams(location.search).has('showcase')
const target = document.querySelector('#app')!
if (showcase) document.body.replaceChildren(target)
else void import('../shared/fixture')
if (showcase) mount(Showcase, { target })
else mount(Example, { target })
