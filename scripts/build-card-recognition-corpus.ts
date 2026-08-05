import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCorpusBundle, type CorpusBuildSpecification } from "@/lib/cardRecognition/corpus";

const [specificationPath, outputRoot] = process.argv.slice(2);
if (!specificationPath || !outputRoot) {
  throw new Error("usage: recognition:corpus:build <build-spec.json> <output-directory>");
}

const specification = JSON.parse(readFileSync(resolve(specificationPath), "utf8")) as CorpusBuildSpecification;
const manifest = buildCorpusBundle(specification, resolve(outputRoot));
process.stdout.write(`${JSON.stringify({
  status: "BUILT",
  corpusVersion: manifest.corpusVersion,
  manifestSha256: manifest.manifestSha256,
  assetCount: manifest.assets.length,
})}\n`);
