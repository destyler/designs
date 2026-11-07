import { Progress } from "@destyler-ui/react";
import { useState } from "react";
export function Basic() {
  const [value, setValue] = useState(65);
  return (
    <div className="parity-stack" style={{ width: "256px" }}>
      <Progress.Root value={value}>
        <Progress.Label>
          Label <span role="status">{value}%</span>
        </Progress.Label>
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <button
        className="parity-button"
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
