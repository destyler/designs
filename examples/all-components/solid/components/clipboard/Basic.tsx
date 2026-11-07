import { Clipboard } from "@destyler-ui/solid";
import { createSignal } from "solid-js";
export function Basic() {
  const [status, setStatus] = createSignal("Not copied");
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText("https://destyler.org");
      setStatus("Copied");
    } catch {
      setStatus("Copy unavailable. Select the link and copy it manually.");
    }
  }
  return (
    <Clipboard.Root value="https://destyler.org">
      <Clipboard.Label>Copy this link</Clipboard.Label>
      <Clipboard.Input readonly />
      <button class="parity-button" onClick={copy}>
        Copy link
      </button>
      <p class="parity-status" role="status">
        {status()}
      </p>
    </Clipboard.Root>
  );
}
