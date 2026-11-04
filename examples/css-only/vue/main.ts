import { createApp } from 'vue'
import Example from './Example.vue'
import Showcase from './Showcase.vue'
import './styles'
import '../shared/fixture.css'
const showcase = new URLSearchParams(location.search).has('showcase')
const target = document.querySelector('#app')!
if (showcase) document.body.replaceChildren(target)
else void import('../shared/fixture')
createApp(showcase ? Showcase : Example).mount(target)
