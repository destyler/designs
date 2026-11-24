import { Calendar as Primitive, parseDate } from '@destyler-ui/react'
import { calendarConstraints, calendarDate, handleCalendarGridKey } from '../Calendar'
import type { CalendarProps } from '../Calendar'

export type { CalendarProps } from '../Calendar'

const parseIsoDate = (iso: string) => parseDate(iso)

export function Calendar({ value, defaultValue, locale = 'en-US', onValueChange, ...props }: CalendarProps) {
  const config = calendarConstraints(parseIsoDate, props)
  return <div className="rd-component rd-calendar">
    <Primitive.Root open selectionMode="single" closeOnSelect={false} allowOutsideDays={false}
      locale={locale} timeZone="UTC" min={config.min} max={config.max}
      value={value === undefined ? undefined : value === null ? [] : [calendarDate(parseIsoDate, value)]}
      defaultValue={value === undefined && defaultValue != null ? [calendarDate(parseIsoDate, defaultValue)] : undefined}
      onValueChange={({ value: dates }) => {
        const next = dates[0]?.toString()
        if (next && !config.blocks(next)) onValueChange?.(next)
      }}>
      <Primitive.Context>{calendar =>
        <Primitive.View view="day">
          <div className="rd-calendar-header">
            <Primitive.PrevTrigger type="button">‹</Primitive.PrevTrigger>
            <span className="rd-calendar-month" aria-live="polite">{calendar.visibleRangeText.start}</span>
            <Primitive.NextTrigger type="button">›</Primitive.NextTrigger>
          </div>
          <div onKeyDownCapture={event => handleCalendarGridKey(event, config.blocks(calendar.focusedValue.toString()))}>
            <Primitive.Table aria-label={config.label}>
              <Primitive.TableHead><Primitive.TableRow>
                {calendar.weekDays.map((day, i) => <Primitive.TableHeader key={i} title={day.long}>{day.short}</Primitive.TableHeader>)}
              </Primitive.TableRow></Primitive.TableHead>
              <Primitive.TableBody>
                {calendar.weeks.map((week, i) => <Primitive.TableRow key={i}>
                  {week.map(day => {
                    const iso = day.toString()
                    const outside = day.compare(calendar.visibleRange.start) < 0 || day.compare(calendar.visibleRange.end) > 0
                    return <Primitive.TableCell key={iso} value={day} disabled={config.disabledDates.has(iso)}>
                      <Primitive.TableCellTrigger asChild><button type="button">{outside ? '' : day.day}</button></Primitive.TableCellTrigger>
                    </Primitive.TableCell>
                  })}
                </Primitive.TableRow>)}
              </Primitive.TableBody>
            </Primitive.Table>
          </div>
        </Primitive.View>
      }</Primitive.Context>
    </Primitive.Root>
  </div>
}
