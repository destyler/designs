<script setup lang="ts">
import { sampleImage } from '../sample-image'
import {Avatar} from '@destyler-ui/vue'
</script>

<template>
  <Avatar.Root>
    <Avatar.Fallback>EL</Avatar.Fallback>
    <Avatar.Image :src="sampleImage" alt="Avatar illustration" />
  </Avatar.Root>
</template>
