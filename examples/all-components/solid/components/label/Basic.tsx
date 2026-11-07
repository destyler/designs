import { Label } from "@destyler-ui/solid";
export function Basic() {
  return (
    <div class="parity-stack" style={{ width: "256px" }}>
      <Label.Root for="demo-username">Username</Label.Root>
      <input id="demo-username" autocomplete="off" />
    </div>
  );
}
