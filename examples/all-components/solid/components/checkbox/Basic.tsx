import { Checkbox } from "@destyler-ui/solid";
export function Basic() {
  return (
    <Checkbox.Root>
      <Checkbox.Control>
        <Checkbox.Indicator>
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
        </Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Label>Checkbox</Checkbox.Label>
      <Checkbox.HiddenInput />
    </Checkbox.Root>
  );
}
