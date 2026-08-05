import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { benchmarkRegionDetection, type RegionBenchmarkInputV1 } from "@/lib/cardRecognition/regionDetection";
import { stableJson } from "@/lib/cardRecognition/stableJson";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath) throw new Error("usage: recognition:regions:benchmark <benchmark-input.json> [report.json]");

const input = JSON.parse(readFileSync(resolve(inputPath), "utf8")) as RegionBenchmarkInputV1;
const report = benchmarkRegionDetection(input);
const serialized = `${stableJson(report)}\n`;
if (outputPath) writeFileSync(resolve(outputPath), serialized, { flag: "wx" });
process.stdout.write(serialized);
