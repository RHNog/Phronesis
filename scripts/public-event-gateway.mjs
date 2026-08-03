import http from "node:http";
import net from "node:net";

const listenHost = "127.0.0.1";
const listenPort = Number(process.env.PHRONESIS_PUBLIC_GATEWAY_PORT ?? 3101);
const targetHost = "127.0.0.1";
const targetPort = Number(process.env.PHRONESIS_PUBLIC_GATEWAY_TARGET_PORT ?? 3100);

const blockedPrefixes = [
  "/settings",
  "/activate",
  "/sign-in",
  "/dev",
  "/api/administration/event-access",
  "/api/administration/invitations",
  "/api/administration/memberships",
  "/api/administration/provider-credentials",
];

function allowedPath(pathname) {
  if (pathname.startsWith("/api/auth/") && pathname !== "/api/auth/event-access") return false;
  return !blockedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function gatewayHeaders(request) {
  const headers = { ...request.headers };
  delete headers.connection;
  delete headers["proxy-connection"];
  delete headers["transfer-encoding"];
  delete headers.upgrade;
  headers["x-phronesis-public-event"] = "1";
  headers["x-forwarded-proto"] = "https";
  headers["x-forwarded-host"] = request.headers.host ?? "";
  const address = request.socket.remoteAddress ?? "";
  headers["x-forwarded-for"] = request.headers["x-forwarded-for"] ? `${request.headers["x-forwarded-for"]}, ${address}` : address;
  return headers;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname === "/healthz") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ ok: true, service: "phronesis-public-event-gateway" }));
    return;
  }
  if (!allowedPath(url.pathname)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    response.end("Not found.");
    return;
  }
  const upstream = http.request({ host: targetHost, port: targetPort, method: request.method, path: request.url, headers: gatewayHeaders(request) }, (upstreamResponse) => {
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
  if (!allowedPath(url.pathname)) return socket.destroy();
  const upstream = net.connect(targetPort, targetHost, () => {
    const headers = gatewayHeaders(request);
    upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`);
    for (const [name, value] of Object.entries(headers)) if (value !== undefined) upstream.write(`${name}: ${Array.isArray(value) ? value.join(", ") : value}\r\n`);
    upstream.write("connection: Upgrade\r\nupgrade: websocket\r\n\r\n");
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
});

server.listen(listenPort, listenHost, () => {
  console.log(`Phronesis public event gateway listening on http://${listenHost}:${listenPort}`);
});
