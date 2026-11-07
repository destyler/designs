<script setup lang="ts">
import { sampleImage } from '../sample-image'
import { AspectRatio } from '@destyler-ui/vue'


</script>

<template>
  <main>
    <AspectRatio.Root :ratio="16 / 9">
      <AspectRatio.Content>
        <img :src="sampleImage" alt="Geometric illustration">
      </AspectRatio.Content>
    </AspectRatio.Root>
  </main>
</template>
