import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const maximumBytes = 8 * 1024 * 1024;
const allowedTypes = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

type CuratedMetadata = {
  categoryId: string;
  sku: string;
  contentType: string;
  byteLength: number;
  contentSha256: string;
  storedAt: string;
};

function validSignature(bytes: Uint8Array, type: string) {
  if (type === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/webp") return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (type === "image/gif") return ["GIF87a", "GIF89a"].includes(new TextDecoder().decode(bytes.slice(0, 6)));
  if (type === "image/avif") return bytes.length >= 16 && new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
  return false;
}

function identityKey(categoryId: string, sku: string) {
  if (!/^[a-z0-9-]{2,40}$/.test(categoryId) || !sku.trim() || sku.length > 300) throw new Error("Curated artwork identity is invalid.");
  return createHash("sha256").update(`${categoryId}\0${sku}`).digest("hex");
}

export class CuratedArtworkStore {
  constructor(private readonly root = process.env.PHRONESIS_CURATED_ARTWORK_PATH ?? resolve(".data/artwork-curated")) {}

  async put(categoryId: string, sku: string, bytes: Uint8Array, contentType: string) {
    const type = contentType.split(";")[0].trim().toLowerCase();
    if (!allowedTypes.has(type) || !bytes.length || bytes.byteLength > maximumBytes || !validSignature(bytes, type)) {
      throw new Error("Curated artwork must be a valid raster image no larger than 8 MB.");
    }
    const key = identityKey(categoryId, sku);
    await mkdir(this.root, { recursive: true });
    const metadata: CuratedMetadata = {
      categoryId,
      sku,
      contentType: type,
      byteLength: bytes.byteLength,
      contentSha256: createHash("sha256").update(bytes).digest("hex"),
      storedAt: new Date().toISOString(),
    };
    const suffix = randomUUID();
    const image = resolve(this.root, `${key}.bin`);
    const manifest = resolve(this.root, `${key}.json`);
    const temporaryImage = `${image}.${suffix}.tmp`;
    const temporaryManifest = `${manifest}.${suffix}.tmp`;
    await Promise.all([
      writeFile(temporaryImage, bytes, { flag: "wx" }),
      writeFile(temporaryManifest, `${JSON.stringify(metadata)}\n`, { flag: "wx" }),
    ]);
    await rename(temporaryImage, image);
    await rename(temporaryManifest, manifest);
    return metadata;
  }

  async get(categoryId: string, sku: string) {
    const key = identityKey(categoryId, sku);
    const [bytes, raw] = await Promise.all([
      readFile(resolve(this.root, `${key}.bin`)),
      readFile(resolve(this.root, `${key}.json`), "utf8"),
    ]);
    const metadata = JSON.parse(raw) as CuratedMetadata;
    if (metadata.categoryId !== categoryId || metadata.sku !== sku || metadata.byteLength !== bytes.byteLength || createHash("sha256").update(bytes).digest("hex") !== metadata.contentSha256) {
      throw new Error("Curated artwork integrity check failed.");
    }
    return { bytes, metadata };
  }

  async has(categoryId: string, sku: string) {
    try { await this.get(categoryId, sku); return true; } catch { return false; }
  }
}

let store: CuratedArtworkStore | undefined;
export function getCuratedArtworkStore() {
  store ??= new CuratedArtworkStore();
  return store;
}

export function curatedArtworkUrl(categoryId: string, sku: string) {
  return `/api/pricing/artwork/curated?category=${encodeURIComponent(categoryId)}&sku=${encodeURIComponent(sku)}`;
}
