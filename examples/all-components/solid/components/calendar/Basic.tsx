import { Calendar } from "@destyler-ui/solid";
import { createSignal, Index } from "solid-js";
import { parseDate, type DateValue } from "@destyler-ui/solid";
export function Basic() {
  const [focused, setFocused] = createSignal<DateValue>(
    parseDate("2026-11-01"),
  );
  const [selected, setSelected] = createSignal<DateValue[]>([]);
  return (
    <div class="parity-stack">
      <Calendar.Root
        open
        closeOnSelect={false}
        fixedWeeks={false}
        focusedValue={focused()}
        onFocusChange={(details) => setFocused(details.focusedValue)}
        value={selected()}
        onValueChange={(details) => setSelected(details.value)}
        min={parseDate("2020-01-01")}
        max={parseDate("2030-12-31")}
        ids={{ table: (key) => `calendar-table-${key.replace(/\s+/g, "-")}` }}
      >
        <Calendar.Content
          class="parity-calendar parity-calendar-content"
          role="group"
          aria-label="Calendar"
        >
          <Calendar.Context>
            {(api) => (
              <>
                <Calendar.ViewControl>
                  <Calendar.PrevTrigger aria-label="Go to previous month">
                    ‹
                  </Calendar.PrevTrigger>
                  <select
                    ref={(node) =>
                      queueMicrotask(() => {
                        node.value = String(api().visibleRange.start.month);
                      })
                    }
                    aria-label="Choose the Month"
                    value={String(api().visibleRange.start.month)}
                    onChange={(event) =>
                      setFocused(
                        api().visibleRange.start.set({
                          month: Number(event.currentTarget.value),
                        }),
                      )
                    }
                  >
                    {Array.from({ length: 12 }, (_, index) => (
                      <option value={index + 1}>
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                        }).format(new Date(2026, index, 1))}
                      </option>
                    ))}
                  </select>
                  <select
                    ref={(node) =>
                      queueMicrotask(() => {
                        node.value = String(api().visibleRange.start.year);
                      })
                    }
                    aria-label="Choose the Year"
                    value={String(api().visibleRange.start.year)}
                    onChange={(event) =>
                      setFocused(
                        api().visibleRange.start.set({
                          year: Number(event.currentTarget.value),
                        }),
                      )
                    }
                  >
                    {Array.from({ length: 11 }, (_, index) => (
                      <option value={2020 + index}>{2020 + index}</option>
                    ))}
                  </select>
                  <Calendar.NextTrigger aria-label="Go to next month">
                    ›
                  </Calendar.NextTrigger>
                </Calendar.ViewControl>
                <Calendar.View view="day">
                  <Calendar.Table>
                    <Calendar.TableHead>
                      <Calendar.TableRow>
                        <Index each={api().weekDays}>
                          {(day) => (
                            <Calendar.TableHeader>
                              {day().short}
                            </Calendar.TableHeader>
                          )}
                        </Index>
                      </Calendar.TableRow>
                    </Calendar.TableHead>
                    <Calendar.TableBody>
                      <Index each={api().weeks}>
                        {(week) => (
                          <Calendar.TableRow>
                            <Index each={week()}>
                              {(day) => (
                                <Calendar.TableCell value={day()}>
                                  <Calendar.TableCellTrigger>
                                    {day().day}
                                  </Calendar.TableCellTrigger>
                                </Calendar.TableCell>
                              )}
                            </Index>
                          </Calendar.TableRow>
                        )}
                      </Index>
                    </Calendar.TableBody>
                  </Calendar.Table>
                </Calendar.View>
              </>
            )}
          </Calendar.Context>
        </Calendar.Content>
      </Calendar.Root>
      <p role="status" class="parity-status">
        {selected()[0]
          ? `Selected: ${selected()[0].year}-${selected()[0].month}-${selected()[0].day}`
          : "Select a date"}
      </p>
    </div>
  );
}
