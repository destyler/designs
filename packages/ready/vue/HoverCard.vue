<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from 'vue';
import { useHoverCard } from '@destyler-ui/vue';
import { createHoverCardIntent, hoverCardPart, hoverCardPositioning, hoverCardTiming,
  resolveHoverCard, type HoverCardProps } from '../HoverCard';

defineOptions({ inheritAttrs: false });
const props = defineProps<HoverCardProps>();
const config = computed(() => resolveHoverCard(props));
const descriptionId = useId();
const open = ref(false);
const intent = createHoverCardIntent(value => { open.value = value; });
onBeforeUnmount(intent.dispose);
const api = useHoverCard({ get open() { return open.value; }, positioning: hoverCardPositioning, ...hoverCardTiming,
  onOpenChange: ({ open: next }) => { if (!next) intent.dismiss(); } });
function onKeyDown(event: KeyboardEvent) {
  if (intent.escape(event.key, event.defaultPrevented, event.isComposing)) event.preventDefault();
}
</script>

<template>
  <span class="rd-component rd-hover-card">
    <a v-bind="hoverCardPart(api.getTriggerProps())" :href="config.href" :aria-describedby="descriptionId"
      @pointerenter="intent.enter('trigger', $event.pointerType)" @pointerleave="intent.leave('trigger', $event.pointerType)"
      @focus="intent.focus" @blur="intent.blur" @keydown="onKeyDown">{{ config.label }}</a>
    <span :id="descriptionId" hidden>{{ config.title ? `${config.title}. ` : '' }}{{ config.description }}</span>
    <span v-bind="api.getPositionerProps()">
      <span v-bind="hoverCardPart(api.getContentProps())" aria-hidden="true"
        @pointerenter="intent.enter('card', $event.pointerType)" @pointerleave="intent.leave('card', $event.pointerType)">
        <strong v-if="config.title">{{ config.title }}</strong>
        <span>{{ config.description }}</span>
      </span>
    </span>
  </span>
</template>
