import { Slider } from "@destyler-ui/solid";
import { createSignal } from "solid-js";
export function Basic() {
  const [value, setValue] = createSignal([-20, 20]);
  return (
    <Slider.Root
      min={-50}
      max={50}
      value={value()}
      onValueChange={(details) => setValue(details.value)}
    >
      <Slider.Label>
        Quantity: <span role="status">{value().join(", ")}</span>
      </Slider.Label>
      <Slider.Control>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb index={0}>
          <Slider.HiddenInput />
        </Slider.Thumb>
        <Slider.Thumb index={1}>
          <Slider.HiddenInput />
        </Slider.Thumb>
      </Slider.Control>
    </Slider.Root>
  );
}
