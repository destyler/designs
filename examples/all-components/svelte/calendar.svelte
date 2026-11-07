<script lang="ts">
  import { Calendar, parseDate } from '@destyler-ui/svelte/calendar'
  let focused = $state(parseDate('2026-11-01'))
  let selected = $state('')
</script>
<div class="parity-stack">
  <Calendar.Root open={true} closeOnSelect={false} bind:focusedValue={focused} onValueChange={details => { const day = details.value[0]; selected = day ? `${day.year}-${day.month}-${day.day}` : '' }} min={parseDate('2020-01-01')} max={parseDate('2030-12-31')} ids={{ table: key => `calendar-table-${key.replace(/\s+/g, '-')}` }} class="parity-calendar">
    <Calendar.Positioner class="parity-calendar-positioner"><Calendar.Content class="parity-calendar-content" role="group" aria-label="Calendar"><Calendar.View view="day">
      <Calendar.Context>
        {#snippet render(api)}
          <Calendar.ViewControl>
            <Calendar.PrevTrigger aria-label="Go to the previous month">‹</Calendar.PrevTrigger>
            <div class="parity-calendar-caption"><Calendar.MonthSelect aria-label="Choose month" /><Calendar.YearSelect aria-label="Choose year" /></div>
            <Calendar.NextTrigger aria-label="Go to the next month">›</Calendar.NextTrigger>
          </Calendar.ViewControl>
          <Calendar.Table>
            <Calendar.TableHead><Calendar.TableRow>{#each api().weekDays as day}<Calendar.TableHeader>{day.short}</Calendar.TableHeader>{/each}</Calendar.TableRow></Calendar.TableHead>
            <Calendar.TableBody>{#each api().weeks as week}<Calendar.TableRow>{#each week as day}<Calendar.TableCell value={day}><Calendar.TableCellTrigger>{day.day}</Calendar.TableCellTrigger></Calendar.TableCell>{/each}</Calendar.TableRow>{/each}</Calendar.TableBody>
          </Calendar.Table>
        {/snippet}
      </Calendar.Context>
    </Calendar.View></Calendar.Content></Calendar.Positioner>
  </Calendar.Root>
  <p role="status" class="parity-status">{selected ? `Selected: ${selected}` : 'Select a date'}</p>
</div>
