export type VerifiedWindowsBundle = {
  status?: "imported" | "already_imported";
  manifestSha256: string;
  manifest: {
    schemaVersion: "phronesis.windows-scan-bundle/v1" | "phronesis.windows-scan-bundle/v2";
    sessionId: string;
    profileName: string;
    pairingSemantics: "unknown" | "adjacent-duplex-front-first" | "adjacent-duplex-back-first";
    frames: Array<{ observedSequence: number; relativePath: string; byteCount: number; sha256: string; side: "FRONT" | "BACK" | "UNKNOWN"; pairedObservedSequence: number | null }>;
  };
};

export function importBundle(bundlePath: string, outputRoot: string, options?: { maxFiles?: number }): Promise<VerifiedWindowsBundle>;
