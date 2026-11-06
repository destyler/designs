<script setup lang="ts">
import { Signature } from '@destyler-ui/vue'
</script>

<template>
  <Signature.Root>
    <Signature.Label>Sign below</Signature.Label>
    <Signature.Control>
      <Signature.Segment />
      <Signature.ClearTrigger>Clear</Signature.ClearTrigger>
      <Signature.Guide />
    </Signature.Control>
  </Signature.Root>
</template>
