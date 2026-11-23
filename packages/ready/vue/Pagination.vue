<script setup lang="ts">
import { Pagination as UI } from '@destyler-ui/vue'
import { computed, ref, watch } from 'vue'
import { paginationState, type PaginationProps } from '../Pagination'

const props = defineProps<Omit<PaginationProps, 'onPageChange'>>()
const emit = defineEmits<{ 'update:page': [page: number]; pageChange: [page: number] }>()
const local = ref(props.defaultPage ?? 1)
const state = computed(() => paginationState(props, local.value))
watch([() => props.page, () => state.value.page], ([page, resolved]) => {
  if (page === undefined && local.value !== resolved) local.value = resolved
}, { immediate: true })
function change({ page }: { page: number }) {
  if (page === state.value.page) return
  if (props.page === undefined) local.value = page
  emit('update:page', page)
  emit('pageChange', page)
}
</script>

<template>
  <UI.Root
    class="rd-component rd-pagination"
    :count="state.count"
    :page-size="state.pageSize"
    :page="state.page"
    :translations="state.translations"
    @page-change="change"
  >
    <UI.PrevTrigger>{{ state.translations.prevTriggerLabel }}</UI.PrevTrigger>
    <UI.Context v-slot="{ pages }">
      <template v-for="(entry, index) in pages" :key="entry.type === 'page' ? entry.value : `gap-${index}`">
        <UI.Item v-if="entry.type === 'page'" v-bind="entry">{{ entry.value }}</UI.Item>
        <UI.Ellipsis v-else :index="index" aria-hidden="true">…</UI.Ellipsis>
      </template>
    </UI.Context>
    <UI.NextTrigger>{{ state.translations.nextTriggerLabel }}</UI.NextTrigger>
  </UI.Root>
</template>
