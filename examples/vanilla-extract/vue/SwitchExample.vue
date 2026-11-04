<script setup lang="ts">
import { ref } from 'vue'
import { Switch } from '@destyler-ui/vue'
import { classes as c } from '@destyler/designs-vanilla-extract-poc'

const checked = ref(false)
</script>

<template>
  <Switch.Root :checked="checked" @checked-change="details => checked = details.checked" :class="c.switchRoot">
    <Switch.Control :class="c.switchControl"><Switch.Thumb :class="c.switchThumb"/></Switch.Control>
    <Switch.HiddenInput role="switch" aria-label="Airplane mode"/>
  </Switch.Root>
</template>
