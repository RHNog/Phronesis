import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copyText } from "@/lib/browser/copyText";

test("copyText prefers the modern Clipboard API", async () => {
  const calls: string[] = [];
  const result = await copyText("worker-link", {
    writeClipboard: async (value) => { calls.push(`modern:${value}`); },
    legacyCopy: (value) => { calls.push(`legacy:${value}`); return true; },
  });

  assert.equal(result, "CLIPBOARD_API");
  assert.deepEqual(calls, ["modern:worker-link"]);
});

test("copyText falls back when Safari rejects the Clipboard API", async () => {
  const calls: string[] = [];
  const result = await copyText("worker-code", {
    writeClipboard: async () => { throw new Error("NotAllowedError"); },
    legacyCopy: (value) => { calls.push(value); return true; },
  });

  assert.equal(result, "LEGACY_COPY");
  assert.deepEqual(calls, ["worker-code"]);
});

test("copyText reports manual recovery when browser copying is unavailable", async () => {
  const result = await copyText("public-link", {
    legacyCopy: () => false,
  });

  assert.equal(result, "MANUAL");
});

test("current access workflows use the shared copy control", () => {
  const sources = [
    readFileSync("components/auth/EventAccessManagement.tsx", "utf8"),
    readFileSync("components/auth/AccessManagement.tsx", "utf8"),
  ];

  assert.equal(sources.every((source) => source.includes("CopyTextButton")), true);
  assert.equal(sources.some((source) => source.includes("navigator.clipboard.writeText")), false);
});
