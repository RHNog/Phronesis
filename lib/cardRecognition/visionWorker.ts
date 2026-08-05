import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type VisionAnalysis = {
  schemaVersion: "phronesis.vision-analysis.v1";
  ocr: Array<{ text: string; confidence: number; x: number; y: number; width: number; height: number }>;
  featurePrint: string;
};

export class VisionRecognitionWorker {
  constructor(private readonly executablePath: string) {}

  async analyze(imagePath: string): Promise<VisionAnalysis> {
    try {
      const { stdout } = await execFileAsync(this.executablePath, ["analyze", imagePath], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
      const value = JSON.parse(stdout) as Partial<VisionAnalysis>;
      if (value.schemaVersion !== "phronesis.vision-analysis.v1" || !Array.isArray(value.ocr) || typeof value.featurePrint !== "string") throw new Error("invalid Vision worker response");
      return value as VisionAnalysis;
    } catch (error) {
      throw new Error(`local Vision analysis failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }
}
