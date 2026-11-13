import { Select } from "@destyler-ui/react";
import { useState } from "react";
import { createListCollection } from "@destyler-ui/react";
export function Basic() {
  const [value, setValue] = useState<string[]>([]);
  const collection = createListCollection({
    items: ["React", "Solid", "Vue", "Svelte"].map((label) => ({
      label,
      value: label.toLowerCase(),
      disabled: label === "Svelte",
    })),
  });
  return (
    <Select.Root
      collection={collection}
      value={value}
      onValueChange={(details) => setValue(details.value)}
    >
      <Select.Label>Framework</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select a Framework" />
          <Select.Indicator>
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
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          <Select.ItemGroup>
            <Select.ItemGroupLabel>Frameworks</Select.ItemGroupLabel>
            {collection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.ItemGroup>
        </Select.Content>
      </Select.Positioner>
      <Select.HiddenSelect />
      <p role="status" className="parity-status">
        {value[0] || "No selection"}
      </p>
    </Select.Root>
  );
}
