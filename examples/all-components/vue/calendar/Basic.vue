<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { Calendar, parseDate } from '@destyler-ui/vue'
const focused = shallowRef(parseDate('2026-11-01'))
const selected = ref('')
</script>
<template>
  <div class="parity-stack">
    <Calendar.Root :open="true" :close-on-select="false" :focused-value="focused" @focus-change="focused = $event.focusedValue" @value-change="selected = $event.value[0] ? `${$event.value[0].year}-${$event.value[0].month}-${$event.value[0].day}` : ''" :min="parseDate('2020-01-01')" :max="parseDate('2030-12-31')" :ids="{ table: key => `calendar-table-${key.replace(/\s+/g, '-')}` }" class="parity-calendar">
      <Calendar.Positioner class="parity-calendar-positioner"><Calendar.Content class="parity-calendar-content" role="group" aria-label="Calendar"><Calendar.View view="day">
        <Calendar.Context v-slot="api">
          <Calendar.ViewControl>
            <Calendar.PrevTrigger aria-label="Go to the previous month">‹</Calendar.PrevTrigger>
            <div class="parity-calendar-caption"><Calendar.MonthSelect aria-label="Choose month" /><Calendar.YearSelect aria-label="Choose year" /></div>
            <Calendar.NextTrigger aria-label="Go to the next month">›</Calendar.NextTrigger>
          </Calendar.ViewControl>
          <Calendar.Table view="day" :columns="7">
            <Calendar.TableHead><Calendar.TableRow><Calendar.TableHeader v-for="day in api.weekDays" :key="day.long">{{ day.short }}</Calendar.TableHeader></Calendar.TableRow></Calendar.TableHead>
            <Calendar.TableBody><Calendar.TableRow v-for="(week, index) in api.weeks" :key="index"><Calendar.TableCell v-for="day in week" :key="day.toString()" :value="day"><Calendar.TableCellTrigger>{{ day.day }}</Calendar.TableCellTrigger></Calendar.TableCell></Calendar.TableRow></Calendar.TableBody>
          </Calendar.Table>
        </Calendar.Context>
      </Calendar.View></Calendar.Content></Calendar.Positioner>
    </Calendar.Root>
    <p role="status" class="parity-status">{{ selected ? `Selected: ${selected}` : 'Select a date' }}</p>
  </div>
</template>
