import { OtpInput } from "@destyler-ui/solid";
import { createSignal } from "solid-js";
export function Basic() {
  const [value, setValue] = createSignal<string[]>(["", "", ""]);
  return (
    <OtpInput.Root
      value={value()}
      onValueChange={(details) => setValue(details.value)}
    >
      <OtpInput.Label>Label</OtpInput.Label>
      <OtpInput.Control>
        <OtpInput.Input index={0} />
        <OtpInput.Input index={1} />
        <OtpInput.Input index={2} />
      </OtpInput.Control>
      <OtpInput.HiddenInput />
      <p class="parity-status" role="status">
        {value().join("").length}/3 characters
      </p>
    </OtpInput.Root>
  );
}
