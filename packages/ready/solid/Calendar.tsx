import { For, createMemo } from 'solid-js'
import { Calendar as Primitive, parseDate } from '@destyler-ui/solid/calendar'
import { calendarConstraints, calendarDate, handleCalendarGridKey } from '../Calendar'
import type { CalendarProps } from '../Calendar'

export type { CalendarProps } from '../Calendar'

const parseIsoDate = (iso: string) => parseDate(iso)

export function Calendar(props: CalendarProps) {
  const config = createMemo(() => calendarConstraints(parseIsoDate, props))
  return <div class="rd-component rd-calendar">
    <Primitive.Root open selectionMode="single" closeOnSelect={false} allowOutsideDays={false}
      locale={props.locale ?? 'en-US'} timeZone="UTC" min={config().min} max={config().max}
      value={props.value === undefined ? undefined : props.value === null ? [] : [calendarDate(parseIsoDate, props.value)]}
      defaultValue={props.value === undefined && props.defaultValue != null ? [calendarDate(parseIsoDate, props.defaultValue)] : undefined}
      onValueChange={({ value: dates }) => {
        const next = dates[0]?.toString()
        if (next && !config().blocks(next)) props.onValueChange?.(next)
      }}>
      <Primitive.Context>{calendar =>
        <Primitive.View view="day">
          <div class="rd-calendar-header">
            <Primitive.PrevTrigger type="button">‹</Primitive.PrevTrigger>
            <span class="rd-calendar-month" aria-live="polite">{calendar().visibleRangeText.start}</span>
            <Primitive.NextTrigger type="button">›</Primitive.NextTrigger>
          </div>
          <div on:keydown={{ capture: true, handleEvent: event => handleCalendarGridKey(event, config().blocks(calendar().focusedValue.toString())) }}>
            <Primitive.Table aria-label={config().label}>
              <Primitive.TableHead><Primitive.TableRow>
                <For each={calendar().weekDays}>{day => <Primitive.TableHeader title={day.long}>{day.short}</Primitive.TableHeader>}</For>
              </Primitive.TableRow></Primitive.TableHead>
              <Primitive.TableBody>
                <For each={calendar().weeks}>{week => <Primitive.TableRow>
                  <For each={week}>{day => {
                    const iso = day.toString()
                    const outside = () => day.compare(calendar().visibleRange.start) < 0 || day.compare(calendar().visibleRange.end) > 0
                    return <Primitive.TableCell value={day} disabled={config().disabledDates.has(iso)}>
                      <Primitive.TableCellTrigger asChild={bindings => <button {...bindings()} type="button">{outside() ? '' : day.day}</button>} />
                    </Primitive.TableCell>
                  }}</For>
                </Primitive.TableRow>}</For>
              </Primitive.TableBody>
            </Primitive.Table>
          </div>
        </Primitive.View>
      }</Primitive.Context>
    </Primitive.Root>
  </div>
}
