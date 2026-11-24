export type SplitterProps = {
  /** Accessible name of the first pane, used to name the resize handle. */
  label: string;
  /** Initial percentage occupied by the first pane; defaults to 50 within the allowed bounds. */
  defaultSize?: number;
  /** Minimum and maximum first-pane percentages; set at mount. Default to 15 and 85. */
  minSize?: number;
  maxSize?: number;
  /** Arrow-key adjustment in percentage points; defaults to 1, or the span if it is smaller. */
  step?: number;
  /** Direction in which the panes are arranged, not the direction of the handle bar. */
  orientation?: 'horizontal' | 'vertical';
  /** Disable pointer and keyboard resizing. */
  disabled?: boolean;
  /** Reports the first pane’s new percentage after a keyboard or pointer resize. */
  onSizeChange?: (size: number) => void;
};

export const splitterPanels = { first: 'first', second: 'second', handle: 'first:second' } as const;

export function resolveSplitter(props: SplitterProps) {
  const { minSize = 15, maxSize = 85, orientation = 'horizontal', disabled = false } = props;
  const { label } = props;
  if (typeof label !== 'string' || label.trim() === '') {
    throw new Error('Ready Splitter: label must contain non-whitespace text.');
  }
  if (orientation !== 'horizontal' && orientation !== 'vertical') {
    throw new RangeError('Ready Splitter: orientation must be horizontal or vertical');
  }
  if (!Number.isFinite(minSize) || !Number.isFinite(maxSize) || minSize <= 0 || maxSize >= 100 || minSize >= maxSize) {
    throw new RangeError('Ready Splitter: bounds must satisfy 0 < minSize < maxSize < 100');
  }
  const { defaultSize = Math.min(maxSize, Math.max(minSize, 50)), step = Math.min(1, maxSize - minSize) } = props;
  if (!Number.isFinite(defaultSize) || defaultSize < minSize || defaultSize > maxSize) {
    throw new RangeError('Ready Splitter: defaultSize must be within the bounds');
  }
  if (!Number.isFinite(step) || step <= 0 || step > maxSize - minSize || minSize + step <= minSize || maxSize - step >= maxSize) {
    throw new RangeError('Ready Splitter: step must advance the size and cannot exceed the resize span');
  }
  return {
    label, orientation, disabled, step,
    defaultSize: [
      { id: splitterPanels.first, size: defaultSize, minSize, maxSize },
      { id: splitterPanels.second, size: 100 - defaultSize, minSize: 100 - maxSize, maxSize: 100 - minSize },
    ],
  };
}

export function splitterFirstSize(panels: readonly { id: string | number; size?: number }[]): number | undefined {
  return panels.find(panel => panel.id === splitterPanels.first)?.size;
}


/** UI 0.0.5's hover state cannot receive keyboard focus. Use CSS for hover feedback instead;
 * suppressing just the handle's pointerover leaves pointerdown and dragging intact. */
export function preventSplitterHover(event: Pick<Event, 'target' | 'currentTarget' | 'stopPropagation'>) {
  const target = event.target;
  if (target instanceof Element && target.matches('[data-scope="splitter"][data-part="resize-trigger"]')
    && target.parentElement?.parentElement === event.currentTarget) {
    event.stopPropagation();
  }
}
