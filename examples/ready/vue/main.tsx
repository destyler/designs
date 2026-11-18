import { createApp } from 'vue'
import Demo from './Demo.vue'
import '../../../packages/ready/theme.css'
import '../demo.css'
for (const id of ['default', 'midnight']) {
  const app = createApp(Demo)
  app.config.idPrefix = `ready-${id}`
  app.mount(document.getElementById(id)!)
}
