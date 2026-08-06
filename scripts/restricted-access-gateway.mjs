import http from "node:http";
import net from "node:net";

const listenHost = "127.0.0.1";
const listenPort = Number(process.env.PHRONESIS_RESTRICTED_GATEWAY_PORT ?? 3102);
const targetHost = "127.0.0.1";
const targetPort = Number(process.env.PHRONESIS_RESTRICTED_GATEWAY_TARGET_PORT ?? 3200);
const expectedHostname = process.env.PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME?.trim().toLowerCase() ?? "";

if (!expectedHostname || expectedHostname.includes(":") || expectedHostname.includes("/")) {
  throw new Error("PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME must be one DNS hostname.");
}

const blockedPrefixes = [
  "/settings",
  "/api/administration",
  "/dev",
  "/activate",
  "/api/auth/activate",
  "/event-access",
  "/api/auth/event-access",
];

function requestHostname(host = "") {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

function allowedPath(pathname) {
  return !blockedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function permittedRequest(request, pathname) {
  return requestHostname(request.headers.host) === expectedHostname && allowedPath(pathname);
}

function gatewayHeaders(request) {
  const headers = { ...request.headers };
  delete headers.connection;
  delete headers.forwarded;
  delete headers["proxy-connection"];
  delete headers["transfer-encoding"];
  delete headers.upgrade;
  delete headers["x-phronesis-public-event"];
  delete headers["x-phronesis-restricted-public"];
  headers.host = expectedHostname;
  headers["x-phronesis-restricted-public"] = "1";
  headers["x-forwarded-proto"] = "https";
  headers["x-forwarded-host"] = expectedHostname;
  headers["x-forwarded-for"] = request.socket.remoteAddress ?? "127.0.0.1";
  return headers;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname === "/healthz") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ ok: true, service: "phronesis-restricted-access-gateway" }));
    return;
  }
  if (!permittedRequest(request, url.pathname)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    response.end("Not found.");
    return;
  }
  const upstream = http.request({
    host: targetHost,
    port: targetPort,
    method: request.method,
    path: request.url,
    headers: gatewayHeaders(request),
  }, (upstreamResponse) => {
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
  if (!permittedRequest(request, url.pathname)) return socket.destroy();
  const upstream = net.connect(targetPort, targetHost, () => {
    const headers = gatewayHeaders(request);
    upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`);
    for (const [name, value] of Object.entries(headers)) {
      if (value !== undefined) upstream.write(`${name}: ${Array.isArray(value) ? value.join(", ") : value}\r\n`);
    }
    upstream.write("connection: Upgrade\r\nupgrade: websocket\r\n\r\n");
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
});

server.listen(listenPort, listenHost, () => {
  console.log(`Phronesis restricted access gateway listening on http://${listenHost}:${listenPort} for ${expectedHostname}`);
});
