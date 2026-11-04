import { createApp } from 'vue'
import App from './App.vue'
import Showcase from './Showcase.vue'
import '../shared/app.css'
import '@destyler/designs-vanilla-extract-poc/styles.css'
import 'virtual:uno.css'
const showcase = new URLSearchParams(location.search).has('showcase')
const isolated = new URLSearchParams(location.search).has('isolated')
if (!isolated && !showcase) await import('../shared/baseline.generated.css')
if (showcase) createApp(Showcase).mount('#app')
else createApp(App, { isolated }).mount('#app')
