<script setup lang="ts">
import '@destyler/designs-css-only-poc/styles.css'
import { ref } from 'vue'
import { Switch } from '@destyler-ui/vue'

const checked = ref(false)
</script>

<template>
  <Switch.Root :checked="checked" @checked-change="details => checked = details.checked">
    <Switch.Control><Switch.Thumb/></Switch.Control>
    <Switch.HiddenInput role="switch" aria-label="Airplane mode"/>
  </Switch.Root>
</template>
