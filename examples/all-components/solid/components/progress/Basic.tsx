import { Progress } from "@destyler-ui/solid";
import { createSignal } from "solid-js";
export function Basic() {
  const [value, setValue] = createSignal(65);
  return (
    <div class="parity-stack" style={{ width: "256px" }}>
      <Progress.Root value={value()}>
        <Progress.Label>
          Label <span role="status">{value()}%</span>
        </Progress.Label>
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <button
        class="parity-button"
        onClick={() =>
          setValue((current) =>
            current >= 100 ? 0 : Math.min(100, current + 10),
          )
        }
      >
        Advance
      </button>
    </div>
  );
}
