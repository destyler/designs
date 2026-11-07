<script setup lang="ts">
import { Carousel } from '@destyler-ui/vue'
import { makeSampleImage } from '../sample-image'
const images = ['4f46e5', '0f766e', 'be123c', 'b45309', '7e22ce'].map(makeSampleImage)
</script>
<template>
  <Carousel.Root class="parity-carousel">
    <Carousel.ItemGroup><Carousel.Item v-for="(image, index) in images" :key="image" :index="index"><img :src="image" :alt="`Slide ${index + 1}`" /></Carousel.Item></Carousel.ItemGroup>
    <Carousel.Control><Carousel.PrevTrigger aria-label="Previous slide">←</Carousel.PrevTrigger><Carousel.NextTrigger aria-label="Next slide">→</Carousel.NextTrigger></Carousel.Control>
  </Carousel.Root>
</template>
