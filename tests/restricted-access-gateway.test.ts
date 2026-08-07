import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getActiveRestrictedPublicOrigin,
  getRestrictedPublicOrigin,
} from "../lib/auth/config.ts";

async function listen(server: http.Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");
  return address.port;
}

async function requestGateway(port: number, path: string, headers: http.OutgoingHttpHeaders = {}) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const request = http.request({ host: "127.0.0.1", port, path, headers }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    request.on("error", reject);
    request.end();
  });
}

test("restricted public origin accepts only a clean HTTPS origin", () => {
  assert.equal(getRestrictedPublicOrigin({ PHRONESIS_RESTRICTED_PUBLIC_ORIGIN: "https://access.phronesis.com" }), "https://access.phronesis.com");
  assert.equal(getRestrictedPublicOrigin({ PHRONESIS_RESTRICTED_PUBLIC_ORIGIN: "http://access.phronesis.com" }), null);
  assert.equal(getRestrictedPublicOrigin({ PHRONESIS_RESTRICTED_PUBLIC_ORIGIN: "https://access.phronesis.com/path" }), null);
  assert.equal(getRestrictedPublicOrigin({ PHRONESIS_RESTRICTED_PUBLIC_ORIGIN: "not a url" }), null);
  assert.equal(
    getActiveRestrictedPublicOrigin({
      PHRONESIS_RESTRICTED_PUBLIC_ORIGIN: "https://access.phronesis.com",
    }),
    null,
  );
  assert.equal(
    getActiveRestrictedPublicOrigin({
      PHRONESIS_RESTRICTED_PUBLIC_MODE: "ENABLED",
      PHRONESIS_RESTRICTED_PUBLIC_ORIGIN: "https://access.phronesis.com",
    }),
    "https://access.phronesis.com",
  );
  assert.equal(
    getActiveRestrictedPublicOrigin({
      PHRONESIS_RESTRICTED_PUBLIC_MODE: "ENABLED",
      PHRONESIS_RESTRICTED_PUBLIC_ORIGIN: "http://access.phronesis.com",
    }),
    null,
  );
});

test("restricted gateway validates Host, overwrites markers, and blocks owner-only paths", async () => {
  const requests: Array<Record<string, string | string[] | undefined>> = [];
  const target = http.createServer((request, response) => {
    requests.push({ ...request.headers, path: request.url });
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      restricted: request.headers["x-phronesis-restricted-public"],
      event: request.headers["x-phronesis-public-event"] ?? null,
      proto: request.headers["x-forwarded-proto"],
      forwardedHost: request.headers["x-forwarded-host"],
      host: request.headers.host,
      path: request.url,
    }));
  });
  const targetPort = await listen(target);
  const reservation = http.createServer();
  const gatewayPort = await listen(reservation);
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const child = spawn(process.execPath, [new URL("../scripts/restricted-access-gateway.mjs", import.meta.url).pathname], {
    env: {
      ...process.env,
      PHRONESIS_RESTRICTED_GATEWAY_PORT: String(gatewayPort),
      PHRONESIS_RESTRICTED_GATEWAY_TARGET_PORT: String(targetPort),
      PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME: "access.phronesis.com",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Gateway did not start.")), 5_000);
      child.stdout.on("data", (chunk) => {
        if (String(chunk).includes("listening")) { clearTimeout(timer); resolve(); }
      });
      child.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Gateway exited ${code}.`)); });
    });
    const health = await fetch(`http://127.0.0.1:${gatewayPort}/healthz`);
    assert.equal(health.status, 200);

    const wrongHost = await requestGateway(gatewayPort, "/sign-in");
    assert.equal(wrongHost.status, 404);

    for (const path of ["/settings", "/api/administration/access-requests", "/dev/test", "/activate", "/api/auth/activate", "/event-access", "/api/auth/event-access"]) {
      const response = await requestGateway(gatewayPort, path, { host: "access.phronesis.com" });
      assert.equal(response.status, 404, path);
    }
    assert.equal(requests.length, 0);

    const proxied = await requestGateway(gatewayPort, "/sign-up", {
        host: "access.phronesis.com",
        "x-phronesis-public-event": "1",
        "x-phronesis-restricted-public": "0",
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "http",
    });
    assert.deepEqual(JSON.parse(proxied.body), {
      restricted: "1",
      event: null,
      proto: "https",
      forwardedHost: "access.phronesis.com",
      host: "access.phronesis.com",
      path: "/sign-up",
    });
    assert.equal(requests.length, 1);
  } finally {
    child.kill("SIGTERM");
    await new Promise<void>((resolve) => target.close(() => resolve()));
  }
});

test("restricted public ingress requires permanent authentication before compatibility and event access", () => {
  const authorization = readFileSync(new URL("../lib/auth/requestAuthorization.ts", import.meta.url), "utf8");
  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.ok(authorization.indexOf("isRestrictedPublicIngress(requestHeaders)") < authorization.indexOf("isPublicEventIngress(requestHeaders)"));
  assert.match(authorization, /if \(!session\?\.user\.id\) return deniedDecision\(module, requiredAccess, "UNAUTHENTICATED"\)/);
  assert.match(proxy, /x-phronesis-restricted-public/);
  assert.match(proxy, /!getSessionCookie\(request\)/);
});
