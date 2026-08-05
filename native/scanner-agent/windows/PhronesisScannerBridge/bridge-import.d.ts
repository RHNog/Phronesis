export type VerifiedWindowsBundle = {
  status?: "imported" | "already_imported";
  manifestSha256: string;
  manifest: {
    sessionId: string;
    profileName: string;
    pairingSemantics: "unknown";
    frames: Array<{ observedSequence: number; relativePath: string; byteCount: number; sha256: string }>;
  };
};

export function importBundle(bundlePath: string, outputRoot: string, options?: { maxFiles?: number }): Promise<VerifiedWindowsBundle>;
