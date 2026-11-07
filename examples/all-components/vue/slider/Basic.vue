<script setup lang="ts">
import { ref } from 'vue'
import { Slider } from '@destyler-ui/vue'

const sliderValue = ref([-20, 20])
</script>
<template>
  <Slider.Root :min="-50" :max="50" v-model="sliderValue">
    <Slider.Label>Quantity:</Slider.Label>
    <Slider.ValueText />
    <Slider.Control>
      <Slider.Track>
        <Slider.Range />
      </Slider.Track>
      <Slider.Thumb v-for="(_, index) in sliderValue" :key="index" :index="index">
        <Slider.DraggingIndicator />
        <Slider.HiddenInput />
      </Slider.Thumb>
    </Slider.Control>

  </Slider.Root>
</template>
