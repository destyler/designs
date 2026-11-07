import { Collapse } from "@destyler-ui/react";
export function Basic() {
  return (
    <Collapse.Root defaultValue={["Vue"]} collapsible>
      <Collapse.Item value="React">
        <Collapse.ItemTrigger>
          React trigger
          <Collapse.ItemIndicator>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Collapse.ItemIndicator>
        </Collapse.ItemTrigger>
        <Collapse.ItemContent>React Content</Collapse.ItemContent>
      </Collapse.Item>
      <Collapse.Item value="Solid">
        <Collapse.ItemTrigger>
          Solid trigger
          <Collapse.ItemIndicator>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Collapse.ItemIndicator>
        </Collapse.ItemTrigger>
        <Collapse.ItemContent>Solid Content</Collapse.ItemContent>
      </Collapse.Item>
      <Collapse.Item value="Svelte" disabled>
        <Collapse.ItemTrigger>
          Svelte trigger
          <Collapse.ItemIndicator>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Collapse.ItemIndicator>
        </Collapse.ItemTrigger>
        <Collapse.ItemContent>Svelte Content</Collapse.ItemContent>
      </Collapse.Item>
      <Collapse.Item value="Vue">
        <Collapse.ItemTrigger>
          Vue trigger
          <Collapse.ItemIndicator>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Collapse.ItemIndicator>
        </Collapse.ItemTrigger>
        <Collapse.ItemContent>Vue Content</Collapse.ItemContent>
      </Collapse.Item>
    </Collapse.Root>
  );
}
