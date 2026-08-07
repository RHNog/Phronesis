import http from "node:http";
import net from "node:net";

const listenHost = "127.0.0.1";
const listenPort = Number(process.env.PHRONESIS_PUBLIC_GATEWAY_PORT ?? 3101);
const targetHost = "127.0.0.1";
const targetPort = Number(process.env.PHRONESIS_PUBLIC_GATEWAY_TARGET_PORT ?? 3100);
const restrictedPublicHostname = process.env.PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME?.trim().toLowerCase() ?? "";

if (restrictedPublicHostname && (restrictedPublicHostname.includes(":") || restrictedPublicHostname.includes("/"))) {
  throw new Error("PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME must be one DNS hostname.");
}

const publicEventBlockedPrefixes = [
  "/settings",
  "/api/administration",
  "/activate",
  "/sign-in",
  "/sign-up",
  "/access-pending",
  "/access-denied",
  "/dev",
];

const restrictedPublicBlockedPrefixes = [
  "/settings",
  "/api/administration",
  "/dev",
  "/activate",
  "/api/auth/activate",
  "/event-access",
  "/api/auth/event-access",
];

const permanentAccountEntryPrefixes = [
  "/sign-in",
  "/sign-up",
  "/access-pending",
  "/access-denied",
];

function pathMatchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function requestHostname(host = "") {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

function hasBetterAuthSession(request) {
  return /(?:^|;\s*)(?:__Secure-)?better-auth(?:\.|-)session_token=/.test(request.headers.cookie ?? "");
}

function isEventWorkerEntry(pathname) {
  return pathMatchesPrefix(pathname, "/event-access") || pathMatchesPrefix(pathname, "/api/auth/event-access");
}

function isPermanentAccountEntry(pathname) {
  if (permanentAccountEntryPrefixes.some((prefix) => pathMatchesPrefix(pathname, prefix))) return true;
  return pathMatchesPrefix(pathname, "/api/auth") && !isEventWorkerEntry(pathname);
}

function ingressFor(request, pathname) {
  if (!restrictedPublicHostname) return "event";
  if (requestHostname(request.headers.host) !== restrictedPublicHostname) return null;
  if (isEventWorkerEntry(pathname)) return "event";
  if (isPermanentAccountEntry(pathname) || hasBetterAuthSession(request)) return "restricted";
  return "event";
}

function allowedPath(ingress, pathname) {
  if (ingress === "restricted") {
    return !restrictedPublicBlockedPrefixes.some((prefix) => pathMatchesPrefix(pathname, prefix));
  }
  if (pathMatchesPrefix(pathname, "/api/auth") && !pathMatchesPrefix(pathname, "/api/auth/event-access")) return false;
  return !publicEventBlockedPrefixes.some((prefix) => pathMatchesPrefix(pathname, prefix));
}

function gatewayHeaders(request, ingress) {
  const headers = { ...request.headers };
  delete headers.connection;
  delete headers.forwarded;
  delete headers["proxy-connection"];
  delete headers["transfer-encoding"];
  delete headers.upgrade;
  delete headers["x-phronesis-public-event"];
  delete headers["x-phronesis-restricted-public"];
  headers[ingress === "restricted" ? "x-phronesis-restricted-public" : "x-phronesis-public-event"] = "1";
  headers["x-forwarded-proto"] = "https";
  headers["x-forwarded-host"] = request.headers.host ?? "";
  headers["x-forwarded-for"] = request.socket.remoteAddress ?? "127.0.0.1";
  return headers;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname === "/healthz") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({
      ok: true,
      service: "phronesis-public-event-gateway",
      restrictedAccounts: Boolean(restrictedPublicHostname),
    }));
    return;
  }
  const ingress = ingressFor(request, url.pathname);
  if (!ingress || !allowedPath(ingress, url.pathname)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    response.end("Not found.");
    return;
  }
  const upstream = http.request({ host: targetHost, port: targetPort, method: request.method, path: request.url, headers: gatewayHeaders(request, ingress) }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    response.end("Phronesis is temporarily unavailable.");
  });
  request.pipe(upstream);
});

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const ingress = ingressFor(request, url.pathname);
  if (!ingress || !allowedPath(ingress, url.pathname)) return socket.destroy();
  const upstream = net.connect(targetPort, targetHost, () => {
    const headers = gatewayHeaders(request, ingress);
    upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`);
    for (const [name, value] of Object.entries(headers)) if (value !== undefined) upstream.write(`${name}: ${Array.isArray(value) ? value.join(", ") : value}\r\n`);
    upstream.write("connection: Upgrade\r\nupgrade: websocket\r\n\r\n");
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
});

server.listen(listenPort, listenHost, () => {
  const accountMode = restrictedPublicHostname ? ` with restricted accounts for ${restrictedPublicHostname}` : "";
  console.log(`Phronesis public event gateway listening on http://${listenHost}:${listenPort}${accountMode}`);
});
