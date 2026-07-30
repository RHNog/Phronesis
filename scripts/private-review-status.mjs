import { execFileSync } from "node:child_process";
import { get } from "node:http";

const localUrl = "http://127.0.0.1:3100/vendor";

function tailscaleStatus() {
  return JSON.parse(execFileSync("/usr/local/bin/tailscale", ["status", "--json"], { encoding: "utf8" }));
}

const privateHost = String(tailscaleStatus().Self?.DNSName ?? "").replace(/\.$/, "");
const privateUrl = privateHost ? `https://${privateHost}:9443/vendor` : null;

function localHealth() {
  return new Promise((resolve) => {
    const request = get(localUrl, { timeout: 3_000 }, (response) => {
      response.resume();
      resolve({ ok: response.statusCode === 200, status: response.statusCode ?? null });
    });
    request.on("timeout", () => request.destroy(new Error("timeout")));
    request.on("error", () => resolve({ ok: false, status: null }));
  });
}

function privateMapping() {
  try {
    const status = JSON.parse(execFileSync("/usr/local/bin/tailscale", ["serve", "status", "--json"], { encoding: "utf8" }));
    const handler = status.Web?.[`${privateHost}:9443`]?.Handlers?.["/"];
    return handler?.Proxy === "http://127.0.0.1:3100";
  } catch {
    return false;
  }
}

const local = await localHealth();
process.stdout.write(`${JSON.stringify({
  local,
  privateMapping: privateMapping(),
  localUrl,
  privateUrl,
  requirements: "Mac awake and online; phone connected to the same Tailscale tailnet.",
}, null, 2)}\n`);
process.exitCode = local.ok && privateMapping() ? 0 : 1;
