<script setup lang="ts">
import { Carousel } from '@destyler-ui/vue'

const images = Array.from({ length: 5 }, (_, i) => `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 500 300%22%3E%3Crect width=%22500%22 height=%22300%22 fill=%22%23${['4f46e5', '0f766e', 'be123c', 'b45309', '7e22ce'][i]}%22/%3E%3Ccircle cx=%22250%22 cy=%22150%22 r=%2280%22 fill=%22%23a5b4fc%22/%3E%3C/svg%3E`)
</script>

<template>
  <Carousel.Root>
    <Carousel.Control>
      <Carousel.PrevTrigger>Previous</Carousel.PrevTrigger>
      <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      <Carousel.AutoplayTrigger>
        <Carousel.Context v-slot="context">
          {{ context.isPlaying ? 'Pause' : 'Play' }}
        </Carousel.Context>
      </Carousel.AutoplayTrigger>
    </Carousel.Control>
    <Carousel.IndicatorGroup>
      <Carousel.Indicator v-for="(_, idx) in images" :key="idx" :index="idx" />
    </Carousel.IndicatorGroup>
    <Carousel.ItemGroup>
      <Carousel.Item v-for="(image, idx) in images" :key="idx" :index="idx">
        <img :src="image" :alt="`Slide ${idx + 1}`" :style="{ height: '300px', width: '100%', objectFit: 'cover' }" />
      </Carousel.Item>
    </Carousel.ItemGroup>
  </Carousel.Root>
</template>
