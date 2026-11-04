import { mount } from 'svelte'
import App from './App.svelte'
import Showcase from './Showcase.svelte'
import '../shared/app.css'
import '@destyler/designs-vanilla-extract-poc/styles.css'
import 'virtual:uno.css'
const showcase = new URLSearchParams(location.search).has('showcase')
const isolated = new URLSearchParams(location.search).has('isolated')
if (!isolated && !showcase) await import('../shared/baseline.generated.css')
if (showcase) mount(Showcase, { target: document.getElementById('app')! })
else mount(App, { target: document.getElementById('app')!, props: { isolated } })
