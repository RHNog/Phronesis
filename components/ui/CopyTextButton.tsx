"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/browser/copyText";

type CopyState = "IDLE" | "COPYING" | "COPIED" | "MANUAL";

export default function CopyTextButton({
  value,
  label,
  copiedLabel = "Copied",
  manualLabel = "Copy manually",
  className = "",
}: {
  value: string;
  label: string;
  copiedLabel?: string;
  manualLabel?: string;
  className?: string;
}) {
  const [copyResult, setCopyResult] = useState<{ state: CopyState; value: string }>({ state: "IDLE", value });
  const manualInput = useRef<HTMLInputElement>(null);
  const state = copyResult.value === value ? copyResult.state : "IDLE";

  useEffect(() => {
    if (state !== "MANUAL") return;
    manualInput.current?.focus({ preventScroll: true });
    manualInput.current?.select();
  }, [state]);

  async function copy(): Promise<void> {
    setCopyResult({ state: "COPYING", value });
    const method = await copyText(value);
    setCopyResult({ state: method === "MANUAL" ? "MANUAL" : "COPIED", value });
  }

  const buttonLabel = state === "COPYING" ? "Copying…" : state === "COPIED" ? copiedLabel : label;

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => void copy()}
        disabled={state === "COPYING"}
        className={className}
      >
        {buttonLabel}
      </button>
      <p role="status" aria-live="polite" className="mt-2 text-xs text-zinc-400">
        {state === "COPIED" ? "Copied to clipboard." : state === "MANUAL" ? "Automatic copy was blocked. Press and hold the text below, then choose Copy." : null}
      </p>
      {state === "MANUAL" ? (
        <label className="mt-2 block text-xs text-zinc-300">
          {manualLabel}
          <input
            ref={manualInput}
            readOnly
            value={value}
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.currentTarget.select()}
            className="mt-1 min-h-11 w-full rounded-lg border border-amber-700 bg-zinc-950 px-3 text-sm text-white selection:bg-cyan-300 selection:text-zinc-950"
          />
        </label>
      ) : null}
    </div>
  );
}
