import { Menu } from "@destyler-ui/react";
import { useState } from "react";
export function Basic() {
  const [checked, setChecked] = useState(false);
  const [framework, setFramework] = useState("");
  const [css, setCss] = useState("");
  return (
    <div className="parity-stack">
      <Menu.Root>
        <Menu.Trigger>Open menu</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel>Framework menu</Menu.ItemGroupLabel>
              <Menu.Item value="dialog" disabled>
                Dialog
              </Menu.Item>
            </Menu.ItemGroup>
            <Menu.Separator />
            <Menu.CheckboxItem
              checked={checked}
              onCheckedChange={(value) => setChecked(Boolean(value))}
              value="my-checkbox"
            >
              <Menu.ItemIndicator>
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
              </Menu.ItemIndicator>
              <Menu.ItemText>Check me</Menu.ItemText>
            </Menu.CheckboxItem>
            <Menu.Separator />
            <Menu.RadioItemGroup
              value={framework}
              onValueChange={(details) => setFramework(details.value)}
            >
              <Menu.ItemGroupLabel>JS Frameworks</Menu.ItemGroupLabel>
              <Menu.RadioItem value="react">
                <Menu.ItemIndicator>•</Menu.ItemIndicator>
                <Menu.ItemText>react</Menu.ItemText>
              </Menu.RadioItem>
              <Menu.RadioItem value="solid">
                <Menu.ItemIndicator>•</Menu.ItemIndicator>
                <Menu.ItemText>solid</Menu.ItemText>
              </Menu.RadioItem>
              <Menu.RadioItem value="vue">
                <Menu.ItemIndicator>•</Menu.ItemIndicator>
                <Menu.ItemText>vue</Menu.ItemText>
              </Menu.RadioItem>
              <Menu.RadioItem value="svelte">
                <Menu.ItemIndicator>•</Menu.ItemIndicator>
                <Menu.ItemText>svelte</Menu.ItemText>
              </Menu.RadioItem>
            </Menu.RadioItemGroup>
            <Menu.Separator />
            <Menu.Root onSelect={(details) => setCss(details.value)}>
              <Menu.TriggerItem>CSS Frameworks</Menu.TriggerItem>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="UnoCSS">UnoCSS</Menu.Item>
                  <Menu.Item value="Tailwind">Tailwind</Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
      <p role="status" className="parity-status">
        {framework || "No framework"}
        {css ? ` · ${css}` : ""}
        {checked ? " · Checked" : ""}
      </p>
    </div>
  );
}
