import { Popover } from "@destyler-ui/solid/popover";
import { ChevronRightIcon } from "../../icons";
export function Basic() {
  return (
    <Popover.Root>
      <Popover.Trigger>
        click me
        <Popover.Indicator>
          <ChevronRightIcon />
        </Popover.Indicator>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content>
          <Popover.Title>title</Popover.Title>
          <Popover.Description>description</Popover.Description>
          <Popover.CloseTrigger>close</Popover.CloseTrigger>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
