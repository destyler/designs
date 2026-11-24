<script lang="ts">
  import { Calendar as Primitive, parseDate } from '@destyler-ui/svelte/calendar'
  import { calendarConstraints, calendarDate, handleCalendarGridKey } from '../Calendar'
  import type { CalendarProps } from '../Calendar'

  const parseIsoDate = (iso: string) => parseDate(iso)

  let { value, defaultValue, disabledDates, label, min, max, locale = 'en-US', onValueChange }: CalendarProps = $props()
  const config = $derived(calendarConstraints(parseIsoDate, { label, min, max, disabledDates }))
</script>

<div class="rd-component rd-calendar">
  <Primitive.Root open selectionMode="single" closeOnSelect={false} allowOutsideDays={false}
    {locale} timeZone="UTC" min={config.min} max={config.max}
    value={value === undefined ? undefined : value === null ? [] : [calendarDate(parseIsoDate, value)]}
    defaultValue={value === undefined && defaultValue != null ? [calendarDate(parseIsoDate, defaultValue)] : undefined}
    onValueChange={({ value: dates }) => {
      const next = dates[0]?.toString()
      if (next && !config.blocks(next)) onValueChange?.(next)
    }}>
    <Primitive.Context>
      {#snippet render(calendar)}
        <Primitive.View view="day">
          <div class="rd-calendar-header">
            <Primitive.PrevTrigger type="button">‹</Primitive.PrevTrigger>
            <span class="rd-calendar-month" aria-live="polite">{calendar().visibleRangeText.start}</span>
            <Primitive.NextTrigger type="button">›</Primitive.NextTrigger>
          </div>
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div onkeydowncapture={event => handleCalendarGridKey(event, config.blocks(calendar().focusedValue.toString()))}>
            <Primitive.Table aria-label={config.label}>
              <Primitive.TableHead><Primitive.TableRow>
                {#each calendar().weekDays as day (day.value.toString())}
                  <Primitive.TableHeader title={day.long}>{day.short}</Primitive.TableHeader>
                {/each}
              </Primitive.TableRow></Primitive.TableHead>
              <Primitive.TableBody>
                {#each calendar().weeks as week (week[0].toString())}
                  <Primitive.TableRow>
                    {#each week as day (day.toString())}
                      <Primitive.TableCell value={day} disabled={config.disabledDates.has(day.toString())}>
                        <Primitive.TableCellTrigger type="button">{day.compare(calendar().visibleRange.start) < 0 || day.compare(calendar().visibleRange.end) > 0 ? '' : day.day}</Primitive.TableCellTrigger>
                      </Primitive.TableCell>
                    {/each}
                  </Primitive.TableRow>
                {/each}
              </Primitive.TableBody>
            </Primitive.Table>
          </div>
        </Primitive.View>
      {/snippet}
    </Primitive.Context>
  </Primitive.Root>
</div>
