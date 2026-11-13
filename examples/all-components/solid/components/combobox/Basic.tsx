import { Combobox } from "@destyler-ui/solid";
import { createSignal } from "solid-js";
import { createListCollection } from "@destyler-ui/solid";
export function Basic() {
  const [value, setValue] = createSignal<string[]>([]);
  const [query, setQuery] = createSignal("");
  const items = ["React", "Solid", "Vue", "Svelte"].map((label) => ({
    label,
    value: label,
    disabled: label === "Svelte",
  }));
  const collection = () =>
    createListCollection({
      items: items.filter((item) =>
        item.label.toLowerCase().includes(query().toLowerCase()),
      ),
    });
  return (
    <Combobox.Root
      collection={collection()}
      value={value()}
      onValueChange={(details) => setValue(details.value)}
      onInputValueChange={(details) => setQuery(details.inputValue)}
    >
      <Combobox.Label>Framework</Combobox.Label>
      <Combobox.Control>
        <Combobox.Input placeholder="Select a framework" />
        <Combobox.Trigger aria-label="Open framework options">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Combobox.Trigger>
        <Combobox.ClearTrigger disabled={!value().length}>
          Clear
        </Combobox.ClearTrigger>
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content>
          {collection().items.length === 0 && <p>No frameworks found.</p>}
          <Combobox.ItemGroup>
            <Combobox.ItemGroupLabel class="parity-sr-only">Frameworks</Combobox.ItemGroupLabel>
            {collection().items.map((item) => (
              <Combobox.Item item={item}>
                <Combobox.ItemText>{item.label}</Combobox.ItemText>
                <Combobox.ItemIndicator>
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </Combobox.ItemIndicator>
              </Combobox.Item>
            ))}
          </Combobox.ItemGroup>
        </Combobox.Content>
      </Combobox.Positioner>
      <p role="status" class="parity-status">
        {value()[0] || "No selection"}
      </p>
    </Combobox.Root>
  );
}
