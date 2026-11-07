<script setup lang="ts">
import { Label } from '@destyler-ui/vue'
</script>

<template>
  <main class="parity-stack" style="width:256px;">
    <Label.Root for="demo-username">
      Username
    </Label.Root>
    <input id="demo-username" class="parity-input" autocomplete="off" />
  </main>
</template>
