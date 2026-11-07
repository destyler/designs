import { useState } from "react";
import { Dialog } from "@destyler-ui/react";
import { ClientPortal } from "../../ClientPortal";
export function Basic() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Dialog.Trigger>Open Dialog</Dialog.Trigger>
      <ClientPortal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <button
              className="parity-dialog-close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="parity-dialog-header">
              <Dialog.Title>Dialog Title</Dialog.Title>
              <Dialog.Description>Dialog Description</Dialog.Description>
            </div>
            <div className="parity-dialog-footer">
              <Dialog.CloseTrigger>Cancel</Dialog.CloseTrigger>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </ClientPortal>
    </Dialog.Root>
  );
}
