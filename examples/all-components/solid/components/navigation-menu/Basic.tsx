import { NavigationMenu } from "@destyler-ui/solid";
import { createSignal } from "solid-js";
export function Basic() {
  const [selected, setSelected] = createSignal("");
  return (
    <div class="parity-stack">
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="getting-started">
            <NavigationMenu.Trigger value="getting-started">
              Getting started{" "}
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
            </NavigationMenu.Trigger>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="components">
            <NavigationMenu.Trigger value="components">
              Components{" "}
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
            </NavigationMenu.Trigger>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="docs">
            <NavigationMenu.Link
              value="documentation"
              href="#documentation"
              onClick={(event) => {
                event.preventDefault();
                setSelected("Documentation");
              }}
            >
              Documentation
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.ViewportPositioner>
          <NavigationMenu.Viewport>
            <NavigationMenu.Content value="getting-started">
              <div class="parity-stack">
                <NavigationMenu.Link
                  value="introduction"
                  href="#introduction"
                  onClick={(event) => {
                    event.preventDefault();
                    setSelected("Introduction");
                  }}
                >
                  Introduction
                </NavigationMenu.Link>
                <NavigationMenu.Link
                  value="installation"
                  href="#installation"
                  onClick={(event) => {
                    event.preventDefault();
                    setSelected("Installation");
                  }}
                >
                  Installation
                </NavigationMenu.Link>
                <NavigationMenu.Link
                  value="typography"
                  href="#typography"
                  onClick={(event) => {
                    event.preventDefault();
                    setSelected("Typography");
                  }}
                >
                  Typography
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
            <NavigationMenu.Content value="components">
              <div class="parity-stack">
                <NavigationMenu.Link
                  value="alert-dialog"
                  href="#alert-dialog"
                  onClick={(event) => {
                    event.preventDefault();
                    setSelected("Alert Dialog");
                  }}
                >
                  Alert Dialog
                </NavigationMenu.Link>
                <NavigationMenu.Link
                  value="hover-card"
                  href="#hover-card"
                  onClick={(event) => {
                    event.preventDefault();
                    setSelected("Hover Card");
                  }}
                >
                  Hover Card
                </NavigationMenu.Link>
                <NavigationMenu.Link
                  value="progress"
                  href="#progress"
                  onClick={(event) => {
                    event.preventDefault();
                    setSelected("Progress");
                  }}
                >
                  Progress
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Viewport>
        </NavigationMenu.ViewportPositioner>
      </NavigationMenu.Root>
      <p role="status" class="parity-status">
        {selected() || "Choose a section"}
      </p>
    </div>
  );
}
