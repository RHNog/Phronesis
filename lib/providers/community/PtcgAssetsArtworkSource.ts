import { POKEMON_SET_ALIASES } from "@/lib/pricing/artwork";
import type { SearchMatch } from "@/lib/pricing/types";
import type { Card, CardImageUrls } from "@/types/card";

const repository = "1niceroli/ptcg-assets";
const defaultSetManifest = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json";
const imageExtension = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const ignoredAsset = /(?:^|\/)(?:_to_sort|_work)(?:\/|$)|(?:^|[-_\/])(?:banner|coin|icon|logo|symbol)(?:[-_.\/]|$)/i;
const communitySets: PokemonSetIdentity[] = [
  { id: "me6pt5", name: "30th Celebration", ptcgoCode: null, series: "Mega Evolution" },
  { id: "mixed", name: "Miscellaneous Cards & Products", ptcgoCode: null, series: "Mixed Products" },
];

type GithubCommitResponse = { sha?: unknown };
type GithubTreeResponse = {
  truncated?: unknown;
  tree?: Array<{ path?: unknown; size?: unknown; type?: unknown }>;
};

type PokemonSetRow = {
  id?: unknown;
  name?: unknown;
  ptcgoCode?: unknown;
  series?: unknown;
};

export type SealedProductClass =
  | "BATTLE_PRODUCT"
  | "BLISTER"
  | "BOOSTER_BOX"
  | "HALF_BOOSTER_BOX"
  | "BOOSTER_BUNDLE"
  | "BOOSTER_PACK"
  | "CHEST"
  | "COLLECTION"
  | "ELITE_TRAINER_BOX"
  | "MINI_TIN"
  | "THEME_DECK"
  | "TIN"
  | "UNKNOWN";

export type PtcgAssetCandidate = {
  bytes: number;
  descriptors: string[];
  path: string;
  productClass: SealedProductClass;
  setId: string;
  sourceUrl: string;
};

export type PtcgAssetsSnapshot = {
  assets: PtcgAssetCandidate[];
  commitSha: string;
  sets: PokemonSetIdentity[];
  sourceFileCount: number;
};

export type PtcgAssetsMatchResult = {
  accepted: Array<{
    sku: string;
    name: string;
    setName: string;
    productClass: SealedProductClass;
    assetPath: string;
  }>;
  ambiguous: Array<{ sku: string; name: string; setName: string; reason: string; candidates: string[] }>;
  artwork: Record<string, CardImageUrls>;
  exact: number;
  unmatched: Array<{ sku: string; name: string; setName: string; reason: string }>;
};

export type PtcgAssetsArtworkSourceOptions = {
  fetcher?: typeof fetch;
  setManifestUrl?: string;
};

type PokemonSetIdentity = {
  id: string;
  name: string;
  ptcgoCode: string | null;
  series: string | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalized(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(?:three|triple)\b/g, " 3 ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function setKeys(value: string): string[] {
  const exact = normalized(value);
  const withoutEdition = exact
    .replace(/\b(?:1st|first|revised|shadowless|unlimited) edition\b/g, " ")
    .replace(/\bshadowless\b/g, " ")
    .replace(/\b(?:revised )?base set reprint run\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const withoutCode = withoutEdition.replace(/^[a-z]{1,8}\d{1,3}\s+/, "");
  const withoutEra = withoutCode.replace(/^(?:ex|sm|sun and moon|sv|scarlet and violet|swsh|sword and shield|xy)\s+/, "");
  const communityAliases: Readonly<Record<string, string>> = {
    "base set": "base",
    expedition: "expedition base set",
    "heartgold soulsilver": "heartgold and soulsilver",
    triumphant: "hs triumphant",
    undaunted: "hs undaunted",
    unleashed: "hs unleashed",
    "me 30th celebration": "30th celebration",
    "me ascended heroes": "ascended heroes",
    "sm base set": "sun and moon",
    "sv scarlet and violet 151": "151",
    "sv scarlet and violet base set": "scarlet and violet",
    "sv01 scarlet and violet base set": "scarlet and violet",
    "swsh01 sword and shield base set": "sword and shield",
    "xy base set": "xy",
  };
  const variants = [exact, withoutEdition, withoutCode, ...(withoutEra === "base set" ? [] : [withoutEra])];
  const aliased = variants.map((key) => communityAliases[key] ?? POKEMON_SET_ALIASES[key] ?? key);
  return [...new Set([...variants, ...aliased, ...aliased.map((key) => key.replace(/^(?:ex|sm|xy)\s+/, ""))].filter(Boolean))];
}

export function classifySealedProduct(value: string): SealedProductClass {
  const name = normalized(value);
  if (/\b(?:case|set of|art bundle|display case)\b/.test(name)) return "UNKNOWN";
  if (/\b(?:battle academy|battle arena deck|battle deck|trainer kit|starter set)\b/.test(name)) return "BATTLE_PRODUCT";
  if (/\belite trainer box\d*\b|\betb\d*\b/.test(name)) return "ELITE_TRAINER_BOX";
  if (/\bbooster bundle\d*\b/.test(name)) return "BOOSTER_BUNDLE";
  if (/\b(?:half|18 pack) booster box\b/.test(name) || /(?:^|\/)display[-_]18(?:\.|$)/i.test(value)) return "HALF_BOOSTER_BOX";
  if (/\b(?:booster box|booster display)\d*\b/.test(name) || /(?:^|\/)display(?:\.|$)/i.test(value)) return "BOOSTER_BOX";
  if (/\b(?:3 pack|three pack|triple) blister\d*\b/.test(name)) return "BLISTER";
  if (/\bblister\d*\b/.test(name)) return "BLISTER";
  if (/\b(?:booster pack|booster wrap|packshot|sleeved booster)\b/.test(name) || /(?:^|\/)packshots(?:\/|$)/i.test(value)) return "BOOSTER_PACK";
  if (/\bmini tins?\d*\b/.test(name) || /(?:^|\/)mini-tins?(?:\/|$)/i.test(value)) return "MINI_TIN";
  if (/\b(?:collector chest|treasure chest)\b/.test(name)) return "CHEST";
  if (/\btheme deck\b/.test(name) || /(?:^|\/)decks(?:\/|$)/i.test(value)) return "THEME_DECK";
  if (/\btins?\d*\b/.test(name) || /(?:^|\/)tins?(?:\/|$)/i.test(value)) return "TIN";
  if (/\b(?:collections?|collector box|premium box|special box|surprise box|ex box|v box|vmax box)\b/.test(name) || /(?:^|\/)collections?(?:\/|$)/i.test(value)) return "COLLECTION";
  return "UNKNOWN";
}

const descriptorNoise = new Set([
  "academy", "art", "battle", "blister", "boost", "booster", "box", "bundle", "card", "cards", "case",
  "collection", "collections", "collector", "deck", "decks", "display", "edition", "elite", "english", "etb", "image", "mini", "pack",
  "packshot", "packshots", "pokemon", "premium", "product", "products", "set", "special", "tcg", "theme", "tin", "tins", "trainer",
  "triple", "wrap", "x", "bwp", "dpp", "hsp", "smp", "svp", "xyp", "1", "2", "3", "4", "5", "6", "7", "8", "9",
]);

function descriptorTokens(value: string, setName = "", setId = ""): string[] {
  const setNoise = new Set([...setKeys(setName).flatMap((key) => key.split(" ")), ...normalized(setId).split(" ")]);
  const tokens = normalized(value.replace(imageExtension, "")).split(" ")
    .filter((token) =>
      token.length > 1 &&
      !descriptorNoise.has(token) &&
      !setNoise.has(token) &&
      !/^\d{2,}$/.test(token) &&
      !/^(?:bw|dp|hgss|sm|sv|swsh|xy)\d+[a-z]*$/.test(token),
    );
  return [...new Set(tokens)].sort();
}

function encodedPath(path: string): string {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function descriptorScore(product: string[], asset: string[]): number {
  if (!product.length || !asset.length) return 0;
  const productSet = new Set(product);
  const assetSet = new Set(asset);
  const shared = product.filter((token) => assetSet.has(token)).length;
  const productCoverage = shared / productSet.size;
  const assetCoverage = shared / assetSet.size;
  return productCoverage >= 0.8 && assetCoverage >= 0.6
    ? (productCoverage + assetCoverage) / 2
    : 0;
}

function cardEvidenceDescriptors(path: string, identities: ReadonlyMap<string, string>): string[] {
  const descriptors: string[] = [];
  const pattern = /(?:^|[-_+\/])(bwp|dpp|hsp|smp|svp|swshp|xyp)[-_]?([a-z]*\d+)(?=[-_.+\/]|$)/gi;
  for (const match of path.matchAll(pattern)) {
    const name = identities.get(`${normalized(match[1])}:${normalized(match[2])}`);
    if (name) descriptors.push(...descriptorTokens(name));
  }
  return descriptors;
}

function uniqueSetId(match: SearchMatch, sets: PokemonSetIdentity[]): string | null {
  const index = new Map<string, Set<string>>();
  const add = (key: string, id: string) => {
    const existing = index.get(key) ?? new Set<string>();
    existing.add(id);
    index.set(key, existing);
  };
  for (const set of sets) {
    for (const key of [...setKeys(set.name), ...setKeys(set.ptcgoCode ?? "")]) add(key, set.id);
  }
  const ids = new Set(setKeys(match.setName).flatMap((key) => [...(index.get(key) ?? [])]));
  return ids.size === 1 ? [...ids][0] : null;
}

function strictProductTokens(value: string): string[] {
  const ignored = new Set(["back", "front", "image", "pokemon", "small", "tcg"]);
  return [...new Set(normalized(value.replace(imageExtension, ""))
    .split(" ")
    .map((token) => token === "collections" ? "collection" : token)
    .filter((token) => token && !ignored.has(token)))].sort();
}

function uniqueNamedProductAsset(match: SearchMatch, candidates: readonly PtcgAssetCandidate[]): PtcgAssetCandidate | undefined {
  const productTokens = strictProductTokens(match.name);
  const exact = candidates.filter((candidate) => {
    const filename = (candidate.path.split("/").at(-1) ?? "").split("+")[0];
    const assetTokens = strictProductTokens(filename);
    return assetTokens.length === productTokens.length &&
      assetTokens.every((token, index) => token === productTokens[index]);
  });
  return exact.length === 1 ? exact[0] : undefined;
}

const miniTinRegionGeneration = new Map([
  ["kanto", "gen1"],
  ["johto", "gen2"],
  ["hoenn", "gen3"],
  ["sinnoh", "gen4"],
  ["unova", "gen5"],
  ["kalos", "gen6"],
  ["alola", "gen7"],
  ["galar", "gen8"],
]);

function uniqueMiniTinRegionAsset(
  match: SearchMatch,
  candidates: readonly PtcgAssetCandidate[],
  productClass: SealedProductClass,
): PtcgAssetCandidate | undefined {
  if (productClass !== "MINI_TIN") return undefined;
  const regionMatch = match.name.match(/\[([^\]]+)\]\s*$/);
  if (!regionMatch) return undefined;
  const generation = miniTinRegionGeneration.get(normalized(regionMatch[1]));
  if (!generation) return undefined;
  const exact = candidates.filter((candidate) => {
    const filename = candidate.path.split("/").at(-1)?.replace(imageExtension, "").toLowerCase();
    return filename === generation && /(?:^|\/)mini-tins?(?:\/|$)/i.test(candidate.path);
  });
  return exact.length === 1 ? exact[0] : undefined;
}

function uniqueMixedProductAsset(
  match: SearchMatch,
  assets: readonly PtcgAssetCandidate[],
  productClass: SealedProductClass,
): PtcgAssetCandidate | undefined {
  return uniqueNamedProductAsset(
    match,
    assets.filter((candidate) => candidate.setId === "mixed" && candidate.productClass === productClass),
  );
}

export function resolvePtcgAssetsArtwork(
  matches: SearchMatch[],
  snapshot: Pick<PtcgAssetsSnapshot, "assets" | "sets">,
  cardEvidence: readonly Card[] = [],
): PtcgAssetsMatchResult {
  const artwork: Record<string, CardImageUrls> = {};
  const accepted: PtcgAssetsMatchResult["accepted"] = [];
  const ambiguous: PtcgAssetsMatchResult["ambiguous"] = [];
  const unmatched: PtcgAssetsMatchResult["unmatched"] = [];
  const cardIdentities = new Map(cardEvidence.map((card) => [
    `${normalized(card.setCode ?? "")}:${normalized(card.number)}`,
    card.name,
  ]));
  for (const match of matches) {
    if (match.categoryId !== "pokemon-en" || match.productType !== "SEALED") continue;
    const productClass = classifySealedProduct(match.name);
    if (productClass === "UNKNOWN") {
      unmatched.push({ sku: match.sku, name: match.name, setName: match.setName, reason: "UNSUPPORTED_OR_COMPOSITE_PRODUCT_CLASS" });
      continue;
    }
    const mixedExact = uniqueMixedProductAsset(match, snapshot.assets, productClass);
    if (mixedExact) {
      artwork[match.sku] = { small: mixedExact.sourceUrl, normal: mixedExact.sourceUrl, large: mixedExact.sourceUrl };
      accepted.push({
        sku: match.sku,
        name: match.name,
        setName: match.setName,
        productClass,
        assetPath: mixedExact.path,
      });
      continue;
    }
    const setId = uniqueSetId(match, snapshot.sets);
    if (!setId) {
      unmatched.push({ sku: match.sku, name: match.name, setName: match.setName, reason: "SET_NOT_EXACT" });
      continue;
    }
    const candidates = snapshot.assets.filter((asset) => asset.setId === setId && asset.productClass === productClass);
    if (!candidates.length) {
      unmatched.push({ sku: match.sku, name: match.name, setName: match.setName, reason: "NO_CLASS_ASSET" });
      continue;
    }
    const namedExact = uniqueNamedProductAsset(match, candidates);
    const regionalExact = uniqueMiniTinRegionAsset(match, candidates, productClass);
    const identityExact = namedExact ?? regionalExact;
    if (identityExact) {
      artwork[match.sku] = { small: identityExact.sourceUrl, normal: identityExact.sourceUrl, large: identityExact.sourceUrl };
      accepted.push({
        sku: match.sku,
        name: match.name,
        setName: match.setName,
        productClass,
        assetPath: identityExact.path,
      });
      continue;
    }
    if (setId === "mixed") {
      ambiguous.push({
        sku: match.sku,
        name: match.name,
        setName: match.setName,
        reason: "MIXED_PRODUCT_FILENAME_NOT_EXACT",
        candidates: candidates.slice(0, 12).map((candidate) => candidate.path),
      });
      continue;
    }
    const productDescriptors = descriptorTokens(match.name, match.setName, setId);
    const ranked = candidates
      .map((candidate) => ({
        candidate,
        score: descriptorScore(
          productDescriptors,
          [...new Set([...candidate.descriptors, ...cardEvidenceDescriptors(candidate.path, cardIdentities)])],
        ),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.candidate.path.localeCompare(b.candidate.path));
    const exact = !productDescriptors.length && candidates.length === 1
      ? candidates[0]
      : ranked[0] && (!ranked[1] || ranked[0].score - ranked[1].score >= 0.1)
        ? ranked[0].candidate
        : undefined;
    if (!exact) {
      ambiguous.push({
        sku: match.sku,
        name: match.name,
        setName: match.setName,
        reason: ranked.length > 1 ? "MULTIPLE_DESCRIPTOR_MATCHES" : "DESCRIPTOR_NOT_UNIQUE",
        candidates: candidates.slice(0, 12).map((candidate) => candidate.path),
      });
      continue;
    }
    artwork[match.sku] = { small: exact.sourceUrl, normal: exact.sourceUrl, large: exact.sourceUrl };
    accepted.push({
      sku: match.sku,
      name: match.name,
      setName: match.setName,
      productClass,
      assetPath: exact.path,
    });
  }
  return { accepted, artwork, exact: Object.keys(artwork).length, ambiguous, unmatched };
}

export class PtcgAssetsArtworkSource {
  private readonly fetcher: typeof fetch;
  private readonly setManifestUrl: URL;

  constructor(options: PtcgAssetsArtworkSourceOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.setManifestUrl = new URL(options.setManifestUrl ?? defaultSetManifest);
    if (this.setManifestUrl.protocol !== "https:" || this.setManifestUrl.hostname !== "raw.githubusercontent.com") {
      throw new Error("Pokémon set manifest must be a trusted HTTPS GitHub raw source.");
    }
  }

  async snapshot(): Promise<PtcgAssetsSnapshot> {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "Phronesis/0.1 community artwork indexer" };
    const commitResponse = await this.fetcher(`https://api.github.com/repos/${repository}/commits/main`, {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!commitResponse.ok) throw new Error(`ptcg-assets commit lookup returned ${commitResponse.status}.`);
    const commit = await commitResponse.json() as GithubCommitResponse;
    const commitSha = text(commit.sha);
    if (!/^[0-9a-f]{40}$/.test(commitSha)) throw new Error("ptcg-assets commit SHA was invalid.");
    const [treeResponse, setResponse] = await Promise.all([
      this.fetcher(`https://api.github.com/repos/${repository}/git/trees/${commitSha}?recursive=1`, {
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(60_000),
      }),
      this.fetcher(this.setManifestUrl, {
        headers: { Accept: "application/json", "User-Agent": "Phronesis/0.1 community artwork indexer" },
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      }),
    ]);
    if (!treeResponse.ok) throw new Error(`ptcg-assets tree lookup returned ${treeResponse.status}.`);
    if (!setResponse.ok) throw new Error(`Pokémon set manifest returned ${setResponse.status}.`);
    const tree = await treeResponse.json() as GithubTreeResponse;
    const rawSets = await setResponse.json() as unknown;
    if (tree.truncated || !Array.isArray(tree.tree)) throw new Error("ptcg-assets recursive tree was absent or truncated.");
    if (!Array.isArray(rawSets)) throw new Error("Pokémon set manifest was not an array.");
    const manifestSets = (rawSets as PokemonSetRow[]).map((row) => ({
      id: text(row.id),
      name: text(row.name),
      ptcgoCode: text(row.ptcgoCode) || null,
      series: text(row.series) || null,
    })).filter((set) => set.id && set.name);
    const sets = [...manifestSets, ...communitySets.filter((candidate) => !manifestSets.some((set) => set.id === candidate.id))];
    const knownSetIds = new Set(sets.map((set) => set.id));
    const assets: PtcgAssetCandidate[] = [];
    for (const item of tree.tree) {
      const path = text(item.path);
      if (item.type !== "blob" || !imageExtension.test(path) || ignoredAsset.test(path)) continue;
      const setId = path.split("/")[0] ?? "";
      if (!knownSetIds.has(setId)) continue;
      const productClass = classifySealedProduct(path);
      if (productClass === "UNKNOWN") continue;
      const setName = sets.find((set) => set.id === setId)?.name ?? "";
      assets.push({
        bytes: typeof item.size === "number" ? item.size : 0,
        descriptors: descriptorTokens(path, setName, setId),
        path,
        productClass,
        setId,
        sourceUrl: `https://raw.githubusercontent.com/${repository}/${commitSha}/${encodedPath(path)}`,
      });
    }
    return { assets, commitSha, sets, sourceFileCount: tree.tree.filter((item) => item.type === "blob").length };
  }
}
