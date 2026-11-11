// Application-only compatibility with the optional-single shadcn demo.
// Keep the headless library's default selection and bounds policy unchanged.
type Day = { year: number; toString(): string };
type Activation = { target: EventTarget | null; defaultPrevented: boolean; preventDefault(): void; key?: string; repeat?: boolean; button?: number };
export function handleOptionalSelection<T extends Day>(event: Activation, api: {
  value: T[];
  setValue(values: []): void;
  getDayTableCellState(props: { value: T }): { selectable: boolean };
}) {
  if (event.defaultPrevented || (event.key !== undefined && event.key !== 'Enter' && event.key !== ' ') || (event.button !== undefined && event.button !== 0)) return;
  const target = event.target instanceof Element ? event.target.closest('[data-scope="calendar"][data-part="table-cell-trigger"][data-view="day"]') : null;
  if (!target) return;
  // Holding a key must not clear then reselect on a repeat event.
  if (event.repeat) { event.preventDefault(); return; }
  const selected = api.value.find(day => day.toString() === target.getAttribute('data-value'));
  if (!selected || !api.getDayTableCellState({ value: selected }).selectable) return;
  event.preventDefault();
  // Unlike clearValue(), setValue([]) preserves the visible month and focus.
  api.setValue([]);
}
export function boundaryCell(day: Day): 'hidden' | 'omitted' | 'day' {
  return day.year < 2020 ? 'hidden' : day.year > 2030 ? 'omitted' : 'day';
}
