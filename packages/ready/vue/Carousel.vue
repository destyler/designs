<script setup lang="ts">
import { computed, useId } from 'vue'
import { Carousel as Primitive } from '@destyler-ui/vue'
import { carouselPage, notifyCarouselPage, slideLabel, validateCarousel, type CarouselItem, type CarouselProps } from '../Carousel'

const props = defineProps<Omit<CarouselProps, 'onPageChange'>>()
const emit = defineEmits<{ pageChange: [page: number] }>()
defineSlots<{ slide?: (props: { item: CarouselItem; index: number }) => unknown }>()
const rootId = useId()
const slides = computed(() => validateCarousel(props.label, props.items))
function change({ page }: { page: number }) {
  notifyCarouselPage(page, slides.value.length, rootId, next => emit('pageChange', next))
}
</script>

<template>
  <Primitive.Root v-if="slides.length" class="rd-component rd-carousel" :aria-label="label" :ids="{ root: rootId }" :slide-count="slides.length"
    :autoplay="false" :loop="false" :slides-per-page="1" @page-change="change">
    <Primitive.Context v-slot="{ page, canScrollPrev, canScrollNext }">
      <Primitive.ItemGroup aria-live="off">
        <Primitive.Item v-for="(item, index) in slides" :key="item.id" :index="index" :aria-label="slideLabel(item, index, slides.length)"
          :inert="carouselPage(page, slides.length) !== index" :aria-hidden="carouselPage(page, slides.length) !== index">
          <slot name="slide" :item="item" :index="index">{{ item.content ?? item.label }}</slot>
        </Primitive.Item>
      </Primitive.ItemGroup>
      <template v-if="slides.length > 1">
        <Primitive.Control>
          <Primitive.PrevTrigger :disabled="false" :aria-disabled="!canScrollPrev"
            @click="!canScrollPrev && $event.preventDefault()">Previous</Primitive.PrevTrigger>
          <Primitive.IndicatorGroup role="group" aria-label="Choose a slide">
            <Primitive.Indicator v-for="(item, index) in slides" :key="item.id" :index="index"
              :tabindex="carouselPage(page, slides.length) === index ? 0 : -1"
              :aria-current="carouselPage(page, slides.length) === index || undefined">{{ index + 1 }}</Primitive.Indicator>
          </Primitive.IndicatorGroup>
          <Primitive.NextTrigger :disabled="false" :aria-disabled="!canScrollNext"
            @click="!canScrollNext && $event.preventDefault()">Next</Primitive.NextTrigger>
        </Primitive.Control>
        <p class="rd-carousel-status" role="status">Slide {{ carouselPage(page, slides.length) + 1 }} of {{ slides.length }}</p>
      </template>
    </Primitive.Context>
  </Primitive.Root>
</template>
