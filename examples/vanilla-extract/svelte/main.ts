import { mount } from 'svelte'
import App from './App.svelte'
import '../shared/app.css'
import '@destyler/designs-vanilla-extract-poc/styles.css'
import 'virtual:uno.css'
const isolated = new URLSearchParams(location.search).has('isolated')
if (!isolated) await import('../shared/baseline.generated.css')
mount(App, { target: document.getElementById('app')!, props: { isolated } })
