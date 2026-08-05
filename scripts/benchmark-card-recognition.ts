import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runCalibration, type CalibrationInputV1 } from "@/lib/cardRecognition/calibration";
import { stableJson } from "@/lib/cardRecognition/stableJson";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath) throw new Error("usage: recognition:benchmark <calibration-input.json> [report.json]");

const input = JSON.parse(readFileSync(resolve(inputPath), "utf8")) as CalibrationInputV1;
const report = runCalibration(input);
const serialized = `${stableJson(report)}\n`;
if (outputPath) writeFileSync(resolve(outputPath), serialized, { flag: "wx" });
process.stdout.write(serialized);
