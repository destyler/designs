import { createSignal } from "solid-js";
import { Dialog } from "@destyler-ui/solid";
import { Portal } from "solid-js/web";
export function Basic() {
  const [open, setOpen] = createSignal(false);
  return (
    <Dialog.Root
      open={open()}
      onOpenChange={(details) => setOpen(details.open)}
    >
      <Dialog.Trigger>Open Dialog</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <button
              class="parity-dialog-close"
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
                stroke-width="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div class="parity-dialog-header">
              <Dialog.Title>Dialog Title</Dialog.Title>
              <Dialog.Description>Dialog Description</Dialog.Description>
            </div>
            <div class="parity-dialog-footer">
              <Dialog.CloseTrigger>Cancel</Dialog.CloseTrigger>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
