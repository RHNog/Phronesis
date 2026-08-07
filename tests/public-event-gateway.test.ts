import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getPublicEventAccessOrigin } from "../lib/auth/config.ts";

async function listen(server: http.Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind.");
  return address.port;
}

test("public event origin accepts only a clean HTTPS origin", () => {
  assert.equal(getPublicEventAccessOrigin({ PHRONESIS_PUBLIC_EVENT_ORIGIN: "https://events.example.test:10000" }), "https://events.example.test:10000");
  assert.equal(getPublicEventAccessOrigin({ PHRONESIS_PUBLIC_EVENT_ORIGIN: "http://events.example.test" }), null);
  assert.equal(getPublicEventAccessOrigin({ PHRONESIS_PUBLIC_EVENT_ORIGIN: "https://events.example.test/path" }), null);
  assert.equal(getPublicEventAccessOrigin({ PHRONESIS_PUBLIC_EVENT_ORIGIN: "not a url" }), null);
});

test("loopback public gateway marks forwarded traffic and blocks owner-only paths", async () => {
  let upstreamRequests = 0;
  const target = http.createServer((request, response) => {
    upstreamRequests += 1;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      marker: request.headers["x-phronesis-public-event"],
      restricted: request.headers["x-phronesis-restricted-public"] ?? null,
      proto: request.headers["x-forwarded-proto"],
      path: request.url,
    }));
  });
  const targetPort = await listen(target);
  const reservation = http.createServer();
  const gatewayPort = await listen(reservation);
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const child = spawn(process.execPath, [new URL("../scripts/public-event-gateway.mjs", import.meta.url).pathname], {
    env: { ...process.env, PHRONESIS_PUBLIC_GATEWAY_PORT: String(gatewayPort), PHRONESIS_PUBLIC_GATEWAY_TARGET_PORT: String(targetPort) },
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
    const settings = await fetch(`http://127.0.0.1:${gatewayPort}/settings`);
    assert.equal(settings.status, 404);
    const permanentAuth = await fetch(`http://127.0.0.1:${gatewayPort}/api/auth/github`);
    assert.equal(permanentAuth.status, 404);
    assert.equal(upstreamRequests, 0);
    const worker = await fetch(`http://127.0.0.1:${gatewayPort}/event-access`);
    assert.deepEqual(await worker.json(), { marker: "1", restricted: null, proto: "https", path: "/event-access" });
    assert.equal(upstreamRequests, 1);
  } finally {
    child.kill("SIGTERM");
    await new Promise<void>((resolve) => target.close(() => resolve()));
  }
});

test("shared public Funnel keeps event workers separate from permanent accounts", async () => {
  const requests: Array<Record<string, string | string[] | undefined>> = [];
  const target = http.createServer((request, response) => {
    requests.push({ ...request.headers, path: request.url });
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      event: request.headers["x-phronesis-public-event"] ?? null,
      restricted: request.headers["x-phronesis-restricted-public"] ?? null,
      proto: request.headers["x-forwarded-proto"],
      forwardedHost: request.headers["x-forwarded-host"],
      forwardedFor: request.headers["x-forwarded-for"],
      path: request.url,
    }));
  });
  const targetPort = await listen(target);
  const reservation = http.createServer();
  const gatewayPort = await listen(reservation);
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const child = spawn(process.execPath, [new URL("../scripts/public-event-gateway.mjs", import.meta.url).pathname], {
    env: {
      ...process.env,
      PHRONESIS_PUBLIC_GATEWAY_PORT: String(gatewayPort),
      PHRONESIS_PUBLIC_GATEWAY_TARGET_PORT: String(targetPort),
      PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME: "access.example.test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const request = (path: string, headers: http.OutgoingHttpHeaders = {}) => new Promise<{ status: number; body: string }>((resolve, reject) => {
    const outbound = http.request({ host: "127.0.0.1", port: gatewayPort, path, headers }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    outbound.on("error", reject);
    outbound.end();
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Gateway did not start.")), 5_000);
      child.stdout.on("data", (chunk) => {
        if (String(chunk).includes("listening")) { clearTimeout(timer); resolve(); }
      });
      child.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Gateway exited ${code}.`)); });
    });

    assert.equal((await request("/sign-up")).status, 404);

    const spoofedSignUp = await request("/sign-up", {
      host: "access.example.test:10000",
      "x-phronesis-public-event": "1",
      "x-phronesis-restricted-public": "0",
      "x-forwarded-for": "203.0.113.1",
      "x-forwarded-host": "attacker.example",
      "x-forwarded-proto": "http",
    });
    assert.deepEqual(JSON.parse(spoofedSignUp.body), {
      event: null,
      restricted: "1",
      proto: "https",
      forwardedHost: "access.example.test:10000",
      forwardedFor: "127.0.0.1",
      path: "/sign-up",
    });

    const eventLogin = await request("/event-access", {
      host: "access.example.test:10000",
      cookie: "better-auth.session_token=forged",
    });
    assert.equal(JSON.parse(eventLogin.body).event, "1");
    assert.equal(JSON.parse(eventLogin.body).restricted, null);

    const anonymousRoot = await request("/", { host: "access.example.test:10000" });
    assert.equal(JSON.parse(anonymousRoot.body).event, "1");

    for (const cookie of [
      "better-auth.session_token=forged",
      "better-auth-session_token=forged",
      "__Secure-better-auth.session_token=forged",
    ]) {
      const accountRoute = await request("/event-ledger", { host: "access.example.test:10000", cookie });
      assert.equal(JSON.parse(accountRoute.body).restricted, "1", cookie);
      assert.equal(JSON.parse(accountRoute.body).event, null, cookie);
    }

    const accountApi = await request("/api/auth/sign-up/email", { host: "access.example.test:10000" });
    assert.equal(JSON.parse(accountApi.body).restricted, "1");

    for (const path of [
      "/settings",
      "/api/administration/access-requests",
      "/dev/test",
      "/activate",
      "/api/auth/activate",
    ]) {
      assert.equal((await request(path, { host: "access.example.test:10000", cookie: "better-auth.session_token=forged" })).status, 404, path);
    }

    assert.equal(requests.length, 7);
  } finally {
    child.kill("SIGTERM");
    await new Promise<void>((resolve) => target.close(() => resolve()));
  }
});

test("public ingress fails closed before optional compatibility and lands workers on Dashboard", () => {
  const authorization = readFileSync(new URL("../lib/auth/requestAuthorization.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/auth/event-access/route.ts", import.meta.url), "utf8");
  const login = readFileSync(new URL("../components/auth/EventAccessLogin.tsx", import.meta.url), "utf8");
  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  const publicIngress = authorization.indexOf("if (isPublicEventIngress(requestHeaders))");
  assert.ok(publicIngress < authorization.indexOf("const status = getAuthRuntimeStatus()", publicIngress));
  assert.match(authorization, /deniedDecision\(module, requiredAccess, "UNAUTHENTICATED"\)/);
  assert.match(route, /const destination = "\/"/);
  assert.match(route, /x-phronesis-public-event/);
  assert.match(route, /secure: secureRequest\(request\)/);
  assert.match(login, /body\.destination\?\?callbackURL/);
  assert.match(proxy, /x-phronesis-public-event/);
  assert.match(proxy, /!eventSession/);
});
