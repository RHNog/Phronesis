import { spawn } from "node:child_process";
import { resolve } from "node:path";

const mode = process.argv[2] === "start" ? "start" : "dev";
const nextArguments = process.argv.slice(3);
const root = process.cwd();
const watcher = spawn(process.execPath, [
  "--import",
  resolve(root, "tests/register-test-hooks.mjs"),
  resolve(root, "scripts/watch-pricing-catalogues.ts"),
], { cwd: root, env: process.env, stdio: "inherit" });
const next = spawn(process.execPath, [resolve(root, "node_modules/next/dist/bin/next"), mode, ...nextArguments], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

function stop(signal = "SIGTERM") {
  if (!watcher.killed) watcher.kill(signal);
  if (!next.killed) next.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stop(signal));
}
next.on("exit", (code, signal) => {
  if (!watcher.killed) watcher.kill("SIGTERM");
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
watcher.on("exit", (code) => {
  if (code && code !== 0) process.stderr.write(`[pricing-sync] observer exited with ${code}; Phronesis remains available with last-good data.\n`);
});
