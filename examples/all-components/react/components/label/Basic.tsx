import { Label } from "@destyler-ui/react";
export function Basic() {
  return (
    <div className="parity-stack" style={{ width: "256px" }}>
      <Label.Root htmlFor="demo-username">Username</Label.Root>
      <input id="demo-username" autoComplete="off" />
    </div>
  );
}
