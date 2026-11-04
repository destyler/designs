<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import SwitchExample from './SwitchExample.vue'
import DialogExample from './DialogExample.vue'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

const view = ref(initialShowcaseState())
let disconnect: (() => void) | undefined
onMounted(() => { disconnect = connectShowcase(value => { view.value = value }) })
onUnmounted(() => disconnect?.())
const theme = computed(() => themes[view.value.theme])
</script>

<template>
  <main :class="['showcase-stage', theme]" data-framework="vue" :data-theme="view.theme">
    <SwitchExample v-if="view.component === 'switch'"/>
    <DialogExample v-else :color-mode="view.theme"/>
  </main>
</template>
