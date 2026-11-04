<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import SwitchExample from './SwitchExample.vue'
import DialogExample from './DialogExample.vue'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

const view = ref(initialShowcaseState())
let disconnect: (() => void) | undefined
onMounted(() => { disconnect = connectShowcase(value => { view.value = value }) })
onUnmounted(() => disconnect?.())
</script>

<template>
  <main data-showcase data-framework="vue" :data-theme="view.theme">
    <SwitchExample v-if="view.component === 'switch'"/>
    <DialogExample v-else/>
  </main>
</template>
