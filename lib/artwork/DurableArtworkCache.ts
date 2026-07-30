import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CardImageUrls } from "@/types/card";

const defaultMaximumBytes = 8 * 1024 * 1024;
const allowedContentTypes = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

type ArtworkAuthorization = "PROVIDER_API" | "PRODUCT_OWNER_ATTESTED_BANDAI" | "VERIFIED_CATALOGUE";

type SourcePolicy = {
  authorization: ArtworkAuthorization;
  path: RegExp;
};

const sourcePolicies = new Map<string, SourcePolicy>([
  ["assets.tcgdex.net", { authorization: "PROVIDER_API", path: /^\// }],
  ["cards.lorcast.io", { authorization: "PROVIDER_API", path: /^\// }],
  ["cards.scryfall.io", { authorization: "PROVIDER_API", path: /^\/(?:art_crop|border_crop|large|normal|png|small)\// }],
  ["en.onepiece-cardgame.com", { authorization: "PRODUCT_OWNER_ATTESTED_BANDAI", path: /^\/images\/cardlist\/card\/[A-Za-z0-9_-]+\.png$/ }],
  ["static.tcgplayer.com", { authorization: "VERIFIED_CATALOGUE", path: /^\// }],
]);

export type ArtworkCacheMetadata = {
  authorization: ArtworkAuthorization;
  byteLength: number;
  contentSha256: string;
  contentType: string;
  retrievedAt: string;
  sourceHost: string;
  sourcePath: string;
  sourceUrlSha256: string;
};

export type CachedArtwork = {
  bytes: Uint8Array;
  metadata: ArtworkCacheMetadata;
};

export type DurableArtworkCacheOptions = {
  fetcher?: typeof fetch;
  maximumBytes?: number;
  now?: () => Date;
  root?: string;
};

function sourcePolicy(value: string): { policy: SourcePolicy; url: URL } | null {
  try {
    const url = new URL(value);
    const policy = sourcePolicies.get(url.hostname);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443") ||
      !policy ||
      !policy.path.test(url.pathname)
    ) return null;
    return { policy, url };
  } catch {
    return null;
  }
}

function hasValidSignature(bytes: Uint8Array, contentType: string): boolean {
  if (contentType === "image/avif") {
    if (bytes.length < 16 || new TextDecoder().decode(bytes.slice(4, 8)) !== "ftyp") return false;
    const brandBytes = bytes.slice(8, Math.min(bytes.length, 64));
    for (let index = 0; index + 4 <= brandBytes.length; index += 4) {
      const brand = new TextDecoder().decode(brandBytes.slice(index, index + 4));
      if (brand === "avif" || brand === "avis") return true;
    }
    return false;
  }
  if (contentType === "image/png") {
    return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  }
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/webp") {
    return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  }
  if (contentType === "image/gif") {
    const signature = new TextDecoder().decode(bytes.slice(0, 6));
    return signature === "GIF87a" || signature === "GIF89a";
  }
  return false;
}

export function isApprovedArtworkSource(value: string): boolean {
  return Boolean(sourcePolicy(value));
}

export function durableArtworkUrl(value: string | undefined): string | undefined {
  if (!value || !isApprovedArtworkSource(value)) return value;
  return `/api/pricing/image?source=${encodeURIComponent(value)}`;
}

export function durableArtworkUrls(urls: CardImageUrls): CardImageUrls {
  return {
    artCrop: durableArtworkUrl(urls.artCrop),
    large: durableArtworkUrl(urls.large),
    normal: durableArtworkUrl(urls.normal),
    small: durableArtworkUrl(urls.small),
  };
}

export class DurableArtworkCache {
  private readonly fetcher: typeof fetch;
  private readonly maximumBytes: number;
  private readonly now: () => Date;
  private readonly root: string;
  private readonly inFlight = new Map<string, Promise<CachedArtwork>>();

  constructor(options: DurableArtworkCacheOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.maximumBytes = options.maximumBytes ?? defaultMaximumBytes;
    this.now = options.now ?? (() => new Date());
    this.root = options.root ?? process.env.PHRONESIS_ARTWORK_CACHE_PATH ?? resolve(".data/artwork");
  }

  async get(source: string): Promise<CachedArtwork> {
    const approved = sourcePolicy(source);
    if (!approved) throw new Error("Artwork source is not approved.");
    const sourceUrlSha256 = createHash("sha256").update(approved.url.toString()).digest("hex");
    const pending = this.inFlight.get(sourceUrlSha256);
    if (pending) return pending;
    const request = this.readOrFetch(approved.url, approved.policy, sourceUrlSha256)
      .finally(() => this.inFlight.delete(sourceUrlSha256));
    this.inFlight.set(sourceUrlSha256, request);
    return request;
  }

  private async readOrFetch(url: URL, policy: SourcePolicy, key: string): Promise<CachedArtwork> {
    const directory = resolve(this.root, key.slice(0, 2));
    const imagePath = resolve(directory, `${key}.bin`);
    const metadataPath = resolve(directory, `${key}.json`);
    try {
      const [bytes, rawMetadata] = await Promise.all([readFile(imagePath), readFile(metadataPath, "utf8")]);
      const metadata = JSON.parse(rawMetadata) as ArtworkCacheMetadata;
      if (bytes.byteLength === metadata.byteLength && createHash("sha256").update(bytes).digest("hex") === metadata.contentSha256) {
        return { bytes, metadata };
      }
    } catch {
      // A cache miss or invalid partial state falls through to one verified provider request.
    }

    const response = await this.fetcher(url, {
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" },
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok || response.status >= 300) throw new Error(`Artwork provider returned ${response.status}.`);
    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength > this.maximumBytes) throw new Error("Artwork exceeds the configured size limit.");
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!allowedContentTypes.has(contentType)) throw new Error("Artwork provider returned an unsupported content type.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.byteLength > this.maximumBytes || !hasValidSignature(bytes, contentType)) {
      throw new Error("Artwork provider returned an invalid raster image.");
    }
    const metadata: ArtworkCacheMetadata = {
      authorization: policy.authorization,
      byteLength: bytes.byteLength,
      contentSha256: createHash("sha256").update(bytes).digest("hex"),
      contentType,
      retrievedAt: this.now().toISOString(),
      sourceHost: url.hostname,
      sourcePath: url.pathname,
      sourceUrlSha256: key,
    };
    await mkdir(directory, { recursive: true });
    const suffix = randomUUID();
    const temporaryImage = `${imagePath}.${suffix}.tmp`;
    const temporaryMetadata = `${metadataPath}.${suffix}.tmp`;
    await Promise.all([
      writeFile(temporaryImage, bytes, { flag: "wx" }),
      writeFile(temporaryMetadata, `${JSON.stringify(metadata)}\n`, { encoding: "utf8", flag: "wx" }),
    ]);
    await rename(temporaryImage, imagePath);
    await rename(temporaryMetadata, metadataPath);
    return { bytes, metadata };
  }
}

let defaultCache: DurableArtworkCache | undefined;

export function getDurableArtworkCache(): DurableArtworkCache {
  defaultCache ??= new DurableArtworkCache();
  return defaultCache;
}
