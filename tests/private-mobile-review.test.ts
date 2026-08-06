import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("private phone review stays loopback-only and tailnet-scoped", () => {
  const launcher = readFileSync(new URL("../scripts/start-phronesis.mjs", import.meta.url), "utf8");
  const status = readFileSync(new URL("../scripts/private-review-status.mjs", import.meta.url), "utf8");
  const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const launchAgent = readFileSync(
    new URL("../ops/launchd/com.phronesis.private-review.plist", import.meta.url),
    "utf8",
  );

  assert.match(launcher, /process\.argv\.slice\(3\)/);
  assert.match(launcher, /let stopping = false/);
  assert.match(launcher, /setTimeout\(\(\) => process\.exit\(0\), 2_000\)/);
  assert.match(packageJson, /review:phone/);
  assert.match(packageJson, /--hostname 127\.0\.0\.1 --port 3100/);
  assert.match(nextConfig, /PHRONESIS_PRIVATE_REVIEW_ORIGIN/);
  assert.match(status, /tailscale/);
  assert.match(launchAgent, /scripts\/start-phronesis\.mjs/);
  assert.match(launchAgent, /PHRONESIS_PRICING_DB_PATH/);
  assert.match(launchAgent, /\.data\/mobile-review\.sqlite/);
  assert.doesNotMatch(launchAgent, /node_modules\/next\/dist\/bin\/next/);
  assert.doesNotMatch(`${launcher}\n${status}\n${packageJson}\n${nextConfig}`, /tailscale funnel|0\.0\.0\.0/);
});
