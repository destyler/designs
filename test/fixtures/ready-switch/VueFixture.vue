<script setup lang="ts">
import { ref } from 'vue'
import { Switch } from '../../../packages/ready/vue'
const proposed = ref('')
</script>

<template>
  <form>
    <Switch label="Airplane mode" description="Turns radios off" name="radios" value="off" default-checked />
    <Switch label="Fixed" name="fixed" :checked="false" @update:checked="proposed = String($event)" />
    <Switch label="Disabled" name="disabled" default-checked disabled />
    <Switch label="Consent" name="consent" required />
    <Switch label="Invalid" name="invalid" error="Check the setting" />
    <span data-proposed>{{ proposed }}</span>
  </form>
</template>
