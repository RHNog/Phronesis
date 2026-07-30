import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("private phone review stays loopback-only and tailnet-scoped", () => {
  const launcher = readFileSync(new URL("../scripts/start-phronesis.mjs", import.meta.url), "utf8");
  const status = readFileSync(new URL("../scripts/private-review-status.mjs", import.meta.url), "utf8");
  const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

  assert.match(launcher, /process\.argv\.slice\(3\)/);
  assert.match(packageJson, /review:phone/);
  assert.match(packageJson, /--hostname 127\.0\.0\.1 --port 3100/);
  assert.match(nextConfig, /PHRONESIS_PRIVATE_REVIEW_ORIGIN/);
  assert.match(status, /tailscale/);
  assert.doesNotMatch(`${launcher}\n${status}\n${packageJson}\n${nextConfig}`, /tailscale funnel|0\.0\.0\.0/);
});
