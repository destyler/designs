<script setup lang="ts">
import { ref, watchPostEffect } from 'vue'
import { Toast as Primitive, Toaster, createToaster } from '@destyler-ui/vue'
import { bindToastHost, readyToastGroup, toastMessageView, type ToastProps } from '../Toast'
import { validateAccessibleText } from '../accessible-text'

const props = withDefaults(defineProps<ToastProps>(), { label: 'Notifications' })
const host = ref<HTMLDivElement>()
const toaster = createToaster(readyToastGroup)
watchPostEffect(onCleanup => {
  if (host.value) onCleanup(bindToastHost(props.controller, toaster, host.value))
})
</script>

<template>
  <div class="rd-component rd-toast" ref="host">
    <Toaster :toaster="toaster" :aria-label="validateAccessibleText(label, 'Toast', 'label')" :aria-atomic="false">
      <template #default="{ id, meta }">
        <Primitive.Root role="group" :aria-atomic="false" :tabindex="-1"
          :aria-labelledby="toastMessageView(id, meta).titleId" :aria-describedby="toastMessageView(id, meta).descriptionId">
          <div>
            <Primitive.Title>{{ toastMessageView(id, meta).title }}</Primitive.Title>
            <Primitive.Description v-if="toastMessageView(id, meta).description">{{ toastMessageView(id, meta).description }}</Primitive.Description>
          </div>
          <Primitive.CloseTrigger :aria-label="toastMessageView(id, meta).closeLabel"><span aria-hidden="true">×</span></Primitive.CloseTrigger>
        </Primitive.Root>
      </template>
    </Toaster>
  </div>
</template>
