import { Calendar } from "@destyler-ui/react";
import { useState } from "react";
import { parseDate, type DateValue } from "@destyler-ui/react";
export function Basic() {
  const [focused, setFocused] = useState<DateValue>(parseDate("2026-11-01"));
  const [selected, setSelected] = useState<DateValue[]>([]);
  return (
    <div className="parity-stack">
      <Calendar.Root
        open
        closeOnSelect={false}
        fixedWeeks={false}
        focusedValue={focused}
        onFocusChange={(details) => setFocused(details.focusedValue)}
        value={selected}
        onValueChange={(details) => setSelected(details.value)}
        min={parseDate("2020-01-01")}
        max={parseDate("2030-12-31")}
        ids={{ table: (key) => `calendar-table-${key.replace(/\s+/g, "-")}` }}
      >
        <Calendar.Content
          className="parity-calendar parity-calendar-content"
          role="group"
          aria-label="Calendar"
        >
          <Calendar.Context>
            {(api) => (
              <>
                <Calendar.ViewControl>
                  <Calendar.PrevTrigger aria-label="Go to previous month">
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </Calendar.PrevTrigger>
                  <div className="parity-calendar-caption">
                    <div className="parity-calendar-dropdown">
                      <select
                        ref={(node) => {
                          if (node)
                            node.value = String(api.visibleRange.start.month);
                        }}
                        aria-label="Choose the Month"
                        value={api.visibleRange.start.month}
                        onChange={(event) =>
                          setFocused(
                            api.visibleRange.start.set({
                              month: Number(event.currentTarget.value),
                            }),
                          )
                        }
                      >
                        {Array.from({ length: 12 }, (_, index) => (
                          <option key={index} value={index + 1}>
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                            }).format(new Date(2026, index, 1))}
                          </option>
                        ))}
                      </select>
                      <span
                        className="parity-calendar-caption-label"
                        aria-hidden="true"
                      >
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                        }).format(
                          new Date(2026, api.visibleRange.start.month - 1, 1),
                        )}
                        <svg
                          aria-hidden="true"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                    <div className="parity-calendar-dropdown">
                      <select
                        ref={(node) => {
                          if (node)
                            node.value = String(api.visibleRange.start.year);
                        }}
                        aria-label="Choose the Year"
                        value={api.visibleRange.start.year}
                        onChange={(event) =>
                          setFocused(
                            api.visibleRange.start.set({
                              year: Number(event.currentTarget.value),
                            }),
                          )
                        }
                      >
                        {Array.from({ length: 11 }, (_, index) => (
                          <option key={index} value={2020 + index}>
                            {2020 + index}
                          </option>
                        ))}
                      </select>

                      <span
                        className="parity-calendar-caption-label"
                        aria-hidden="true"
                      >
                        {api.visibleRange.start.year}
                        <svg
                          aria-hidden="true"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <Calendar.NextTrigger aria-label="Go to next month">
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Calendar.NextTrigger>
                </Calendar.ViewControl>
                <Calendar.View view="day">
                  <Calendar.Table>
                    <Calendar.TableHead>
                      <Calendar.TableRow>
                        {api.weekDays.map((day) => (
                          <Calendar.TableHeader key={day.short}>
                            {day.short}
                          </Calendar.TableHeader>
                        ))}
                      </Calendar.TableRow>
                    </Calendar.TableHead>
                    <Calendar.TableBody>
                      {api.weeks.map((week, index) => (
                        <Calendar.TableRow key={index}>
                          {week.map((day) => (
                            <Calendar.TableCell
                              key={day.toString()}
                              value={day}
                            >
                              <Calendar.TableCellTrigger>
                                {day.day}
                              </Calendar.TableCellTrigger>
                            </Calendar.TableCell>
                          ))}
                        </Calendar.TableRow>
                      ))}
                    </Calendar.TableBody>
                  </Calendar.Table>
                </Calendar.View>
              </>
            )}
          </Calendar.Context>
        </Calendar.Content>
      </Calendar.Root>
      <p role="status" className="parity-status">
        {selected[0]
          ? `Selected: ${selected[0].year}-${selected[0].month}-${selected[0].day}`
          : "Select a date"}
      </p>
    </div>
  );
}
