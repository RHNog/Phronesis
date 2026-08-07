import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getAuthDatabasePath } from "@/lib/auth/config";
import type { PurchaseEvidenceImage } from "@/lib/purchases/domain";

export const PURCHASE_EVIDENCE_MAXIMUM_BYTES = 8 * 1024 * 1024;

const allowedTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function validSignature(bytes: Uint8Array, type: string) {
  if (type === "image/png") {
    return (
      bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every(
        (value, index) => bytes[index] === value,
      )
    );
  }
  if (type === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }
  if (type === "image/webp") {
    return (
      bytes.length >= 12 &&
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  }
  if (type === "image/gif") {
    return ["GIF87a", "GIF89a"].includes(
      new TextDecoder().decode(bytes.slice(0, 6)),
    );
  }
  if (type === "image/avif") {
    return (
      bytes.length >= 16 &&
      new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp"
    );
  }
  return false;
}

function validateId(id: string) {
  if (!uuidPattern.test(id)) {
    throw new Error("Purchase photo identity is invalid.");
  }
}

function defaultRoot() {
  return (
    process.env.PHRONESIS_PURCHASE_EVIDENCE_PATH ??
    resolve(dirname(getAuthDatabasePath()), "purchase-evidence")
  );
}

export class PurchaseEvidenceStore {
  constructor(private readonly root = defaultRoot()) {}

  async put(
    bytes: Uint8Array,
    declaredContentType: string,
  ): Promise<PurchaseEvidenceImage> {
    const contentType = declaredContentType
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (
      !allowedTypes.has(contentType) ||
      !bytes.length ||
      bytes.byteLength > PURCHASE_EVIDENCE_MAXIMUM_BYTES ||
      !validSignature(bytes, contentType)
    ) {
      throw new Error(
        "Purchase photo must be a valid JPEG, PNG, WebP, GIF, or AVIF image no larger than 8 MB.",
      );
    }
    const id = randomUUID();
    const metadata: PurchaseEvidenceImage = {
      id,
      contentType,
      byteLength: bytes.byteLength,
      contentSha256: createHash("sha256").update(bytes).digest("hex"),
      uploadedAt: new Date().toISOString(),
    };
    await mkdir(this.root, { recursive: true });
    const temporarySuffix = randomUUID();
    const imagePath = resolve(this.root, `${id}.bin`);
    const manifestPath = resolve(this.root, `${id}.json`);
    const temporaryImagePath = `${imagePath}.${temporarySuffix}.tmp`;
    const temporaryManifestPath = `${manifestPath}.${temporarySuffix}.tmp`;
    try {
      await Promise.all([
        writeFile(temporaryImagePath, bytes, { flag: "wx" }),
        writeFile(temporaryManifestPath, `${JSON.stringify(metadata)}\n`, {
          flag: "wx",
        }),
      ]);
      await rename(temporaryImagePath, imagePath);
      await rename(temporaryManifestPath, manifestPath);
    } catch (error) {
      await Promise.all([
        rm(temporaryImagePath, { force: true }),
        rm(temporaryManifestPath, { force: true }),
        rm(imagePath, { force: true }),
        rm(manifestPath, { force: true }),
      ]);
      throw error;
    }
    return metadata;
  }

  async get(id: string) {
    validateId(id);
    const [bytes, rawMetadata] = await Promise.all([
      readFile(resolve(this.root, `${id}.bin`)),
      readFile(resolve(this.root, `${id}.json`), "utf8"),
    ]);
    const metadata = JSON.parse(rawMetadata) as PurchaseEvidenceImage;
    if (
      metadata.id !== id ||
      !allowedTypes.has(metadata.contentType) ||
      metadata.byteLength !== bytes.byteLength ||
      createHash("sha256").update(bytes).digest("hex") !==
        metadata.contentSha256
    ) {
      throw new Error("Purchase photo integrity check failed.");
    }
    return { bytes, metadata };
  }

  async delete(id: string) {
    validateId(id);
    await Promise.all([
      rm(resolve(this.root, `${id}.bin`), { force: true }),
      rm(resolve(this.root, `${id}.json`), { force: true }),
    ]);
  }
}

let store: PurchaseEvidenceStore | undefined;

export function getPurchaseEvidenceStore() {
  store ??= new PurchaseEvidenceStore();
  return store;
}

export function purchaseEvidenceUrl(id: string) {
  return `/api/purchases/evidence?id=${encodeURIComponent(id)}`;
}
