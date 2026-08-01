import { spawn } from "node:child_process";
import { resolve } from "node:path";
import nextEnvironment from "@next/env";

const { loadEnvConfig } = nextEnvironment;

const mode = process.argv[2] === "start" ? "start" : "dev";
const nextArguments = process.argv.slice(3);
const root = process.cwd();
loadEnvConfig(root);
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
const sealedWorker = process.env.PKMNPRICES_API_KEY?.trim()
  ? spawn(process.execPath, [
      "--import",
      resolve(root, "tests/register-test-hooks.mjs"),
      resolve(root, "scripts/sync-pkmnprices-sealed.ts"),
      "--watch",
    ], { cwd: root, env: process.env, stdio: "inherit" })
  : null;

function stop(signal = "SIGTERM") {
  if (!watcher.killed) watcher.kill(signal);
  if (sealedWorker && !sealedWorker.killed) sealedWorker.kill(signal);
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
sealedWorker?.on("exit", (code) => {
  if (code && code !== 0) process.stderr.write(`[pkmnprices-sealed] worker exited with ${code}; Phronesis remains available with last-good data.\n`);
});
