import { loadEnvConfig } from "@next/env";
import { createPriceChartingDailySync, getPriceChartingDailySources } from "../lib/providers/pricecharting/server";

loadEnvConfig(process.cwd());

function millisecondsUntilNextRun(now = new Date()): number {
  const next = new Date(now);
  next.setUTCHours(6, 15, 0, 0);
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return Math.max(60_000, next.getTime() - now.getTime());
}

async function synchronize(): Promise<boolean> {
  const sources = getPriceChartingDailySources();
  if (sources.length === 0) throw new Error("Configure at least one encrypted PriceCharting CSV download URL in Settings.");
  const sync = createPriceChartingDailySync();
  try {
    const results = await sync.run(sources);
    process.stdout.write(`${JSON.stringify({ event: "pricecharting-daily-sync", results })}\n`);
    return results.every((result) => result.status !== "FAILED");
  } finally {
    sync.close();
  }
}

const watch = process.argv.includes("--watch");
try {
  if (!(await synchronize()) && !watch) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.message : "PriceCharting daily sync failed.";
  process.stderr.write(`[pricecharting] ${message.replace(/[\r\n]+/g, " ")}\n`);
  if (!watch) process.exitCode = 1;
}

if (watch) {
  let timer: NodeJS.Timeout | undefined;
  const schedule = () => {
    timer = setTimeout(async () => {
      try { await synchronize(); }
      catch (error) {
        const message = error instanceof Error ? error.message : "PriceCharting daily sync failed.";
        process.stderr.write(`[pricecharting] ${message.replace(/[\r\n]+/g, " ")}\n`);
      } finally { schedule(); }
    }, millisecondsUntilNextRun());
  };
  schedule();
  for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => { if (timer) clearTimeout(timer); process.exit(0); });
}
