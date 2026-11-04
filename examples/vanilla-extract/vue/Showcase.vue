<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Dialog, Switch } from '@destyler-ui/vue'
import { classes as c, themes } from '@destyler/designs-vanilla-extract-poc'
import { connectShowcase, initialShowcaseState } from '../shared/showcase'
import '@fontsource-variable/geist'
import '../shared/showcase.css'

const view = ref(initialShowcaseState())
const checked = ref(false)
const mounted = ref(false)
let disconnect: (() => void) | undefined
onMounted(() => { mounted.value = true; disconnect = connectShowcase(value => { view.value = value }) })
onUnmounted(() => disconnect?.())
const theme = computed(() => themes[view.value.theme])
</script>

<template>
  <main :class="['showcase-stage', theme]" data-framework="vue" :data-theme="view.theme">
    <Switch.Root v-if="view.component === 'switch'" :checked="checked" @checked-change="details => checked = details.checked" :class="c.switchRoot">
      <Switch.Label class="showcase-sr-only">Airplane mode</Switch.Label>
      <Switch.Control :class="c.switchControl"><Switch.Thumb :class="c.switchThumb"/></Switch.Control>
      <Switch.HiddenInput role="switch"/>
    </Switch.Root>
    <Dialog.Root v-else>
      <Dialog.Trigger :class="c.button">Open dialog</Dialog.Trigger>
      <Teleport v-if="mounted" to="body">
        <div :class="['showcase-portal', theme]" data-portal-owner="vue" :data-theme="view.theme">
          <Dialog.Backdrop :class="c.dialogBackdrop"/>
          <Dialog.Positioner :class="c.dialogPositioner">
            <Dialog.Content :class="c.dialogContent" data-demo-dialog="vue">
              <div :class="c.dialogHeader">
                <Dialog.Title :class="c.dialogTitle">Dialog title</Dialog.Title>
                <Dialog.Description :class="c.dialogDescription">This is a dialog description.</Dialog.Description>
              </div>
              <div :class="c.dialogFooter"><Dialog.CloseTrigger :class="c.button">Close</Dialog.CloseTrigger></div>
            </Dialog.Content>
          </Dialog.Positioner>
        </div>
      </Teleport>
    </Dialog.Root>
  </main>
</template>
