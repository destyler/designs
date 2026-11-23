import { Splitter as Primitive } from '@destyler-ui/solid/splitter';
import { createMemo, type JSX } from 'solid-js';
import { preventSplitterHover, resolveSplitter, splitterFirstSize, splitterPanels, type SplitterProps } from '../Splitter';

type Props = SplitterProps & {
  first?: JSX.Element;
  second?: JSX.Element;
};

export function Splitter(props: Props) {
  const layout = createMemo(() => resolveSplitter(props));

  return (
    <div class="rd-splitter" on:pointerover={{ capture: true, handleEvent: preventSplitterHover }} data-orientation={layout().orientation}>
      <Primitive.Root defaultSize={layout().defaultSize} orientation={layout().orientation} onSizeChange={({ size }) => {
        const first = splitterFirstSize(size);
        if (first !== undefined) props.onSizeChange?.(first);
      }}>
        <Primitive.Panel id={splitterPanels.first}>{props.first}</Primitive.Panel>
        <Primitive.ResizeTrigger id={splitterPanels.handle} step={layout().step} disabled={layout().disabled}
          type="button" tabindex={layout().disabled ? -1 : 0} aria-disabled={layout().disabled || undefined} aria-label={layout().label} />
        <Primitive.Panel id={splitterPanels.second}>{props.second}</Primitive.Panel>
      </Primitive.Root>
    </div>
  );
}
