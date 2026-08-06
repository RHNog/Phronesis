import type { SearchMatch } from "@/lib/pricing/types";

const tcgplayerSearchOrigin = "https://www.tcgplayer.com";
const tcgplayerSearchPath = "/search/all/product";

type TcgplayerVerificationIdentity = Pick<
  SearchMatch,
  "collectorNumber" | "name" | "setName"
>;

function uniqueVisibleTerms(
  values: Array<string | null | undefined>,
): string[] {
  const terms: string[] = [];
  for (const value of values) {
    const term = value?.trim();
    if (!term) continue;
    const normalized = term.toLocaleLowerCase("en-US");
    if (
      terms.some(
        (existing) => existing.toLocaleLowerCase("en-US") === normalized,
      )
    )
      continue;
    terms.push(term);
  }
  return terms;
}

export function tcgplayerVerificationQuery(
  identity: TcgplayerVerificationIdentity,
): string {
  return uniqueVisibleTerms([
    identity.name,
    identity.collectorNumber,
    identity.setName,
  ]).join(" ");
}

export function tcgplayerVerificationUrl(
  identity: TcgplayerVerificationIdentity,
): string {
  const url = new URL(tcgplayerSearchPath, tcgplayerSearchOrigin);
  url.searchParams.set("q", tcgplayerVerificationQuery(identity));
  url.searchParams.set("view", "grid");
  return url.toString();
}
