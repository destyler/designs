<script setup lang="ts">
import { Toast, Toaster, createToaster } from '@destyler-ui/vue'

const props = defineProps<{
  duration?: number
}>()

const toaster = createToaster({ placement: 'bottom-end', overlap: true, gap: 24, duration: props.duration })

const createToast = () => {
  toaster.create({
    title: 'Title',
    description: 'Description',
    type: 'info',
  })
}
</script>

<template>
  <button class="parity-button" @click="createToast">Create Toast</button>
  <Toaster :toaster="toaster" v-slot="toast">
    <Toast.Root>
      <Toast.Title>{{ toast.title }}</Toast.Title>
      <Toast.Description>{{ toast.description }}</Toast.Description>
      <Toast.ActionTrigger>Action</Toast.ActionTrigger>
      <Toast.CloseTrigger aria-label="Close notification">×</Toast.CloseTrigger>
    </Toast.Root>
  </Toaster>
</template>
