<script setup lang="ts">
import { ref } from 'vue'
import { OtpInput } from '@destyler-ui/vue'
const value = ref<string[]>([])
</script>

<template>
  <OtpInput.Root v-model="value">
    <OtpInput.Label>Label</OtpInput.Label>
    <OtpInput.Control>
      <OtpInput.Input v-for="id in [0, 1, 2]" :key="id" :index="id" />
    </OtpInput.Control>
    <OtpInput.HiddenInput />
  <p role="status" class="parity-status">{{ value.join('').length }}/3 characters</p></OtpInput.Root>
</template>
