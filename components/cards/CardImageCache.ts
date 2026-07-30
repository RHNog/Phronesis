export type CardImageSource =
  | "Repository"
  | "Replay"
  | "Provider"
  | "Cached"
  | "Placeholder";

export type CardImageUrls = {
  small?: string;
  normal?: string;
  large?: string;
};

export type CardImageCandidate = {
  source: Exclude<CardImageSource, "Cached" | "Placeholder">;
  urls?: CardImageUrls;
};

export type CardImageResolution = {
  source: CardImageSource;
  sourceDetail?: Exclude<CardImageSource, "Cached" | "Placeholder">;
  url?: string;
};

export type CardImageSize = "thumbnail" | "card" | "preview";

const imageCache = new Map<string, CardImageResolution>();

const sourcePriority: CardImageCandidate["source"][] = [
  "Repository",
  "Replay",
  "Provider",
];

const directImageHosts = new Set(["cards.scryfall.io", "static.tcgplayer.com"]);

export function shouldBypassCardImageOptimization(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("/api/pricing/image?source=")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && directImageHosts.has(parsed.hostname);
  } catch {
    return false;
  }
}

function selectUrl(urls: CardImageUrls | undefined, size: CardImageSize) {
  if (!urls) return undefined;
  if (size === "thumbnail") return urls.small ?? urls.normal ?? urls.large;
  if (size === "preview") return urls.large ?? urls.normal ?? urls.small;
  return urls.normal ?? urls.large ?? urls.small;
}

export function createCardImageCacheKey(assetKey: string, size: CardImageSize) {
  return `${assetKey}:${size}`;
}

export function resolveCardImage(
  assetKey: string,
  size: CardImageSize,
  candidates: CardImageCandidate[],
): CardImageResolution {
  const key = createCardImageCacheKey(assetKey, size);
  const cached = imageCache.get(key);

  if (cached?.url) {
    return { ...cached, source: "Cached", sourceDetail: cached.sourceDetail ?? cached.source as CardImageCandidate["source"] };
  }

  for (const source of sourcePriority) {
    const candidate = candidates.find((item) => item.source === source);
    const url = selectUrl(candidate?.urls, size);

    if (url) {
      const resolution: CardImageResolution = {
        source,
        sourceDetail: source,
        url,
      };
      imageCache.set(key, resolution);
      return resolution;
    }
  }

  return { source: "Placeholder" };
}

export function invalidateCardImage(assetKey: string) {
  for (const key of imageCache.keys()) {
    if (key.startsWith(`${assetKey}:`)) imageCache.delete(key);
  }
}

export function clearCardImageCache() {
  imageCache.clear();
}
