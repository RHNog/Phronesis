import { loadEnvConfig } from "@next/env";
import { createPkmnPricesSealedSync } from "../lib/providers/pkmnprices/server";

loadEnvConfig(process.cwd());

function millisecondsUntilNextUtcRun(now = new Date()): number {
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(0, 5, 0, 0);
  return Math.max(60_000, next.getTime() - now.getTime());
}

async function synchronize(): Promise<void> {
  const summary = await createPkmnPricesSealedSync().run();
  process.stdout.write(`${JSON.stringify({ event: "pkmnprices-sealed-sync", ...summary })}\n`);
}

const watch = process.argv.includes("--watch");
await synchronize();

if (watch) {
  let timer: NodeJS.Timeout | undefined;
  const schedule = () => {
    timer = setTimeout(async () => {
      try {
        await synchronize();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sealed sync failed.";
        process.stderr.write(`[pkmnprices-sealed] ${message.replace(/[\r\n]+/g, " ")}\n`);
      } finally {
        schedule();
      }
    }, millisecondsUntilNextUtcRun());
  };
  schedule();
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      if (timer) clearTimeout(timer);
      process.exit(0);
    });
  }
}
