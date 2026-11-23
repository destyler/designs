import { Splitter as Primitive } from '@destyler-ui/react';
import type { ReactNode } from 'react';
import { preventSplitterHover, resolveSplitter, splitterFirstSize, splitterPanels, type SplitterProps } from '../Splitter';

type Props = SplitterProps & {
  first?: ReactNode;
  second?: ReactNode;
};

export function Splitter(props: Props) {
  const layout = resolveSplitter(props);

  return (
    <div className="rd-splitter" onPointerOverCapture={event => preventSplitterHover(event)} data-orientation={layout.orientation}>
      <Primitive.Root defaultSize={layout.defaultSize} orientation={layout.orientation} onSizeChange={({ size }) => {
        const first = splitterFirstSize(size);
        if (first !== undefined) props.onSizeChange?.(first);
      }}>
        <Primitive.Panel id={splitterPanels.first}>{props.first}</Primitive.Panel>
        <Primitive.ResizeTrigger id={splitterPanels.handle} step={layout.step} disabled={layout.disabled}
          type="button" tabIndex={layout.disabled ? -1 : 0} aria-disabled={layout.disabled || undefined} aria-label={layout.label} />
        <Primitive.Panel id={splitterPanels.second}>{props.second}</Primitive.Panel>
      </Primitive.Root>
    </div>
  );
}
