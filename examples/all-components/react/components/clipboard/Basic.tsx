import { Clipboard } from "@destyler-ui/react";
import { useState } from "react";
export function Basic() {
  const [status, setStatus] = useState("Not copied");
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
      <Clipboard.Input readOnly />
      <button className="parity-button" onClick={copy}>
        Copy link
      </button>
      <p className="parity-status" role="status">
        {status}
      </p>
    </Clipboard.Root>
  );
}
