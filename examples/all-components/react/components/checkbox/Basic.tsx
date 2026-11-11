import { Checkbox } from "@destyler-ui/react";
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Label>Checkbox</Checkbox.Label>
      <Checkbox.HiddenInput />
    </Checkbox.Root>
  );
}
