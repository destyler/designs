import { Slider } from "@destyler-ui/react";
import { useState } from "react";
export function Basic() {
  const [value, setValue] = useState([-20, 20]);
  return (
    <Slider.Root
      min={-50}
      max={50}
      value={value}
      onValueChange={(details) => setValue(details.value)}
    >
      <Slider.Label>
        Quantity: <span role="status">{value.join(", ")}</span>
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
