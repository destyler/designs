import { createApp } from 'vue'
import Fixture from './VueFixture.vue'
import { expose } from './state'

const app = createApp(Fixture)
app.mount('#app')
expose(() => app.unmount())
