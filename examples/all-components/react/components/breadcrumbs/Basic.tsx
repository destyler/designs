import { Breadcrumbs } from "@destyler-ui/react";
import { useState } from "react";
export function Basic() {
  const [destination, setDestination] = useState("Smartphones");
  const items = [
    { id: "1", label: "Home", href: "#home" },
    { id: "2", label: "Products", href: "#products" },
    { id: "3", label: "Electronics", href: "#electronics" },
    { id: "4", label: "Smartphones", href: undefined },
  ];
  return (
    <div className="parity-stack">
      <Breadcrumbs.Root items={items}>
        <Breadcrumbs.List>
          {items.map((item) => (
            <Breadcrumbs.Item key={item.id} item={item}>
              <Breadcrumbs.Link
                item={item}
                onClick={(event) => {
                  event.preventDefault();
                  setDestination(item.label);
                }}
              >
                {item.label}
              </Breadcrumbs.Link>
              {item.href && (
                <Breadcrumbs.Separator>
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Breadcrumbs.Separator>
              )}
            </Breadcrumbs.Item>
          ))}
        </Breadcrumbs.List>
      </Breadcrumbs.Root>
      <p role="status" className="parity-status">
        Selected: {destination}
      </p>
    </div>
  );
}
