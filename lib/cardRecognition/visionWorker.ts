import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateRegionDetection, type RegionDetectionResult } from "@/lib/cardRecognition/regionDetection";

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

  async detectRegions(imagePath: string): Promise<RegionDetectionResult> {
    try {
      const { stdout } = await execFileAsync(this.executablePath, ["detect-regions", imagePath], { timeout: 60_000, maxBuffer: 1024 * 1024 });
      const raw = JSON.parse(stdout) as { schemaVersion?: string; coordinateOrigin?: string; regions?: Array<{ order: number; x: number; y: number; width: number; height: number; rotationDegrees: number; confidence: number }> };
      const result = {
        schemaVersion: raw.schemaVersion,
        coordinateOrigin: raw.coordinateOrigin,
        regions: Array.isArray(raw.regions) ? raw.regions.map((region) => ({ order: region.order, confidence: region.confidence, geometry: { x: region.x, y: region.y, width: region.width, height: region.height, rotationDegrees: region.rotationDegrees } })) : raw.regions,
      } as RegionDetectionResult;
      validateRegionDetection(result);
      return result;
    } catch (error) {
      throw new Error(`local Vision region detection failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }
}
