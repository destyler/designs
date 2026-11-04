import { createApp } from 'vue'
import App from './App.vue'
import '../shared/app.css'
import '@destyler/designs-vanilla-extract-poc/styles.css'
import 'virtual:uno.css'
const isolated = new URLSearchParams(location.search).has('isolated')
if (!isolated) await import('../shared/baseline.generated.css')
createApp(App, { isolated }).mount('#app')
