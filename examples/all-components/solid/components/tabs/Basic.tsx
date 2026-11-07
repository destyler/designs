import { Tabs } from "@destyler-ui/solid";
export function Basic() {
  return (
    <Tabs.Root defaultValue="React">
      <Tabs.List>
        <Tabs.Trigger value="React">React Trigger</Tabs.Trigger>
        <Tabs.Trigger value="Solid">Solid Trigger</Tabs.Trigger>
        <Tabs.Trigger value="Svelte" disabled>
          Svelte Trigger
        </Tabs.Trigger>
        <Tabs.Trigger value="Vue">Vue Trigger</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="React">React Content</Tabs.Content>
      <Tabs.Content value="Solid">Solid Content</Tabs.Content>
      <Tabs.Content value="Svelte">Svelte Content</Tabs.Content>
      <Tabs.Content value="Vue">Vue Content</Tabs.Content>
    </Tabs.Root>
  );
}
