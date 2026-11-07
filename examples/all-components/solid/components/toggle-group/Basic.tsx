import { ToggleGroup } from "@destyler-ui/solid";
export function Basic() {
  return (
    <ToggleGroup.Root aria-label="Select a letter">
      <ToggleGroup.Item value="a" aria-label="A">
        A
      </ToggleGroup.Item>
      <ToggleGroup.Item value="b" aria-label="B">
        B
      </ToggleGroup.Item>
      <ToggleGroup.Item value="c" aria-label="C">
        C
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
