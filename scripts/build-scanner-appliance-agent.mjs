#!/usr/bin/env node

import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(projectRoot, "public", "downloads", "phronesis-scanner-agent.mjs");
const defaultName = process.platform === "win32" ? "phronesis-scanner-agent.exe" : "phronesis-scanner-agent";
const output = resolve(process.argv[2] || join(projectRoot, "build", "scanner-agent", defaultName));
const temporary = mkdtempSync(join(tmpdir(), "phronesis-scanner-sea-"));
const seaNode = process.env.PHRONESIS_SEA_NODE || process.execPath;

try {
  mkdirSync(dirname(output), { recursive: true });
  const configPath = join(temporary, "sea-config.json");
  writeFileSync(configPath, `${JSON.stringify({
    main: source,
    mainFormat: "module",
    executable: seaNode,
    output,
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: false,
  }, null, 2)}\n`);
  const built = spawnSync(seaNode, ["--build-sea", configPath], { cwd: projectRoot, encoding: "utf8" });
  if (built.status !== 0) {
    process.stderr.write(built.stderr || built.stdout || "Node failed to build the scanner agent executable.\n");
    process.exit(1);
  }
  if (process.platform !== "win32") chmodSync(output, 0o755);
  if (process.platform === "darwin") {
    const signed = spawnSync("codesign", ["--force", "--sign", "-", output], { encoding: "utf8" });
    if (signed.status !== 0) {
      process.stderr.write(signed.stderr || "Ad-hoc codesigning failed.\n");
      process.exit(1);
    }
  }
  const checksum = createHash("sha256").update(readFileSync(output)).digest("hex");
  const checksumPath = `${output}.sha256`;
  writeFileSync(checksumPath, `${checksum}  ${basename(output)}\n`);
  process.stdout.write(`${JSON.stringify({ output, checksumPath, sha256: checksum, platform: process.platform, architecture: process.arch })}\n`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
