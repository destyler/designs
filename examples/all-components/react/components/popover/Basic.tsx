import { Popover } from "@destyler-ui/react";
export interface BasicProps {
  lazyMount?: boolean;
  unmountOnExit?: boolean;
}
export function Basic({ lazyMount, unmountOnExit }: BasicProps = {}) {
  return (
    <Popover.Root lazyMount={lazyMount} unmountOnExit={unmountOnExit}>
      <Popover.Trigger>
        click me
        <Popover.Indicator />
      </Popover.Trigger>

      <Popover.Positioner data-testid="positioner">
        <Popover.Content>
          <Popover.Title>title</Popover.Title>
          <Popover.Description>description</Popover.Description>
          <Popover.CloseTrigger>close</Popover.CloseTrigger>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
