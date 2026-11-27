<script setup lang="ts">
import { computed } from 'vue'
import { Calendar as Primitive, parseDate } from '@destyler-ui/vue'
import { calendarConstraints, calendarDate, handleCalendarGridKey } from '../Calendar'
import type { CalendarProps } from '../Calendar'

const parseIsoDate = (iso: string) => parseDate(iso)

const props = defineProps<Omit<CalendarProps, 'onValueChange'>>()
const emit = defineEmits<{ 'update:value': [value: string]; valueChange: [value: string] }>()
const config = computed(() => calendarConstraints(parseIsoDate, props))
const valueModel = computed(() => props.value === undefined ? undefined : props.value === null ? [] : [calendarDate(parseIsoDate, props.value)])
const initial = computed(() => props.value === undefined && props.defaultValue != null ? [calendarDate(parseIsoDate, props.defaultValue)] : undefined)
function change({ value }: { value: { toString(): string }[] }) {
  const next = value[0]?.toString()
  if (next && !config.value.blocks(next)) {
    emit('update:value', next)
    emit('valueChange', next)
  }
}
</script>

<template>
  <div class="rd-component rd-calendar">
    <Primitive.Root inline selection-mode="single" :allow-outside-days="false"
      :locale="locale ?? 'en-US'" time-zone="UTC" :min="config.min" :max="config.max"
      :model-value="valueModel" :default-value="initial" @value-change="change">
      <Primitive.Context v-slot="calendar">
        <Primitive.View view="day">
          <div class="rd-calendar-header">
            <Primitive.PrevTrigger type="button">‹</Primitive.PrevTrigger>
            <span class="rd-calendar-month" aria-live="polite">{{ calendar.visibleRangeText.start }}</span>
            <Primitive.NextTrigger type="button">›</Primitive.NextTrigger>
          </div>
          <div @keydown.capture="event => handleCalendarGridKey(event, config.blocks(calendar.focusedValue.toString()))">
            <Primitive.Table :aria-label="config.label">
              <Primitive.TableHead><Primitive.TableRow>
                <Primitive.TableHeader v-for="(day, i) in calendar.weekDays" :key="i" :title="day.long">{{ day.short }}</Primitive.TableHeader>
              </Primitive.TableRow></Primitive.TableHead>
              <Primitive.TableBody>
                <Primitive.TableRow v-for="(week, i) in calendar.weeks" :key="i">
                  <Primitive.TableCell v-for="day in week" :key="day.toString()" :value="day" :disabled="config.disabledDates.has(day.toString())">
                    <Primitive.TableCellTrigger as-child><button type="button">{{ day.compare(calendar.visibleRange.start) < 0 || day.compare(calendar.visibleRange.end) > 0 ? '' : day.day }}</button></Primitive.TableCellTrigger>
                  </Primitive.TableCell>
                </Primitive.TableRow>
              </Primitive.TableBody>
            </Primitive.Table>
          </div>
        </Primitive.View>
      </Primitive.Context>
    </Primitive.Root>
  </div>
</template>
