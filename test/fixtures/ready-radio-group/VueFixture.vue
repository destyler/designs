<script setup lang="ts">
import { ref } from 'vue'
import RadioGroup from '../../../packages/ready/vue/RadioGroup.vue'
import { items } from './items'

const proposal = ref('')
const managed = ref<string | null>(null)
</script>

<template>
  <form>
    <RadioGroup label="Schedule" :items="items" name="schedule" default-value="daily" />
    <RadioGroup label="Record" :items="items" name="record" required />
    <RadioGroup label="Fixed" :items="items" name="fixed" value="daily" @value-change="proposal = $event" />
    <RadioGroup v-model:value="managed" label="Managed" :items="items" name="managed" />
    <RadioGroup label="Locked" :items="items" name="locked" default-value="daily" disabled required />
    <span data-proposed>{{ proposal }}</span>
    <button type="button" @click="managed = null">Clear managed</button>
  </form>
</template>
