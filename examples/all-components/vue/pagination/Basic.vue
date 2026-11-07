<script setup lang="ts">
import { ref } from 'vue'
import { Pagination } from '@destyler-ui/vue'
const currentPage = ref(1)
</script>
<template>
  <div class="parity-stack"><Pagination.Root :page="currentPage" @page-change="currentPage = $event.page" :count="100" :page-size="10" :sibling-count="2">
    <Pagination.PrevTrigger>
      Previous
      <span class="visually-hidden">Page</span>
    </Pagination.PrevTrigger>
    <Pagination.Context v-slot="pagination">
      <template v-for="(page, index) in pagination.pages">
        <Pagination.Item v-if="page.type === 'page'" :key="index" :value="page.value" :type="page.type">
          {{ page.value }}
        </Pagination.Item>
        <Pagination.Ellipsis v-else :key="'e' + index" :index="index">&#8230;</Pagination.Ellipsis>
      </template>
    </Pagination.Context>
    <Pagination.NextTrigger>
      Next
      <span class="visually-hidden">Page</span>
    </Pagination.NextTrigger>
  </Pagination.Root><p role="status" class="parity-status">Page {{ currentPage }} of 10 · 100 items</p></div>
</template>
