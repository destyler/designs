import { HoverCard } from "@destyler-ui/react";
export function Basic() {
  return (
    <HoverCard.Root openDelay={0} closeDelay={0}>
      <HoverCard.Trigger>Hover me</HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content>Content</HoverCard.Content>
      </HoverCard.Positioner>
    </HoverCard.Root>
  );
}
