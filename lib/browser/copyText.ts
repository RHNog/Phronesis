export type CopyTextMethod = "CLIPBOARD_API" | "LEGACY_COPY" | "MANUAL";

export type CopyTextAdapters = {
  writeClipboard?: (value: string) => Promise<void>;
  legacyCopy?: (value: string) => boolean;
};

function browserClipboardAdapters(): CopyTextAdapters {
  return {
    writeClipboard:
      typeof navigator !== "undefined" && navigator.clipboard?.writeText
        ? (value) => navigator.clipboard.writeText(value)
        : undefined,
    legacyCopy: (value) => {
      if (typeof document === "undefined" || typeof document.execCommand !== "function") return false;

      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.readOnly = true;
      textarea.setAttribute("aria-hidden", "true");
      textarea.style.position = "fixed";
      textarea.style.inset = "0 auto auto -9999px";
      textarea.style.fontSize = "16px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);

      try {
        textarea.focus({ preventScroll: true });
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        return document.execCommand("copy");
      } catch {
        return false;
      } finally {
        textarea.remove();
        activeElement?.focus({ preventScroll: true });
      }
    },
  };
}

export async function copyText(value: string, adapters: CopyTextAdapters = browserClipboardAdapters()): Promise<CopyTextMethod> {
  if (adapters.writeClipboard) {
    try {
      await adapters.writeClipboard(value);
      return "CLIPBOARD_API";
    } catch {
      // Safari and embedded browsers may reject the modern API even from a direct tap.
    }
  }

  try {
    if (adapters.legacyCopy?.(value)) return "LEGACY_COPY";
  } catch {
    // Manual selection remains available to the user below the control.
  }

  return "MANUAL";
}
