import { Radio } from "@destyler-ui/solid";
import { createSignal } from "solid-js";
export function Basic() {
  const [value, setValue] = createSignal("");
  return (
    <Radio.Root
      value={value()}
      onValueChange={(details) => setValue(details.value || "")}
    >
      <Radio.Label>Framework</Radio.Label>
      <Radio.Item value="react">
        <Radio.ItemControl />
        <Radio.ItemText>React</Radio.ItemText>
        <Radio.ItemHiddenInput />
      </Radio.Item>
      <Radio.Item value="solid">
        <Radio.ItemControl />
        <Radio.ItemText>Solid</Radio.ItemText>
        <Radio.ItemHiddenInput />
      </Radio.Item>
      <Radio.Item value="vue">
        <Radio.ItemControl />
        <Radio.ItemText>Vue</Radio.ItemText>
        <Radio.ItemHiddenInput />
      </Radio.Item>
      <Radio.Item value="svelte" disabled>
        <Radio.ItemControl />
        <Radio.ItemText>Svelte</Radio.ItemText>
        <Radio.ItemHiddenInput />
      </Radio.Item>
      <p role="status" class="parity-status">
        {value() || "No selection"}
      </p>
    </Radio.Root>
  );
}
