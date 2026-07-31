import { normalizeSearchText } from "@/lib/pricing/searchText";

export type PricingSearchInterpretation = {
  input: string;
  canonical: string;
  message: string;
};

export type PricingSearchTokenPlan = {
  token: string;
  alternatives: string[];
};

export type PricingSearchPlan = {
  normalized: string;
  tokens: PricingSearchTokenPlan[];
  ftsQuery: string;
  interpretations: PricingSearchInterpretation[];
};

const numberedPokemonFamilies = ["swsh", "sv", "sm", "xy"] as const;

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].slice(0, 6);
}

function numberedCodeAlternatives(
  family: (typeof numberedPokemonFamilies)[number],
  digits: string,
): { alternatives: string[]; canonical: string } {
  const compactNumber = String(Number(digits));
  const paddedNumber = compactNumber.padStart(2, "0");
  const canonical = `${family}${paddedNumber}`;
  const alternatives = [`${family}${compactNumber}`, canonical];
  if (family === "swsh") {
    alternatives.push(`sh${compactNumber}`, `sh${paddedNumber}`);
  }
  return { alternatives: unique(alternatives), canonical };
}

function structuredAlternatives(token: string): {
  alternatives: string[];
  canonical?: string;
} {
  const swordShield = token.match(/^(?:swsh|sh)0*(\d{1,2})$/);
  if (swordShield) {
    return numberedCodeAlternatives("swsh", swordShield[1]);
  }
  for (const family of numberedPokemonFamilies.slice(1)) {
    const match = token.match(new RegExp(`^${family}0*(\\d{1,2})$`));
    if (match) return numberedCodeAlternatives(family, match[1]);
  }
  return { alternatives: [token] };
}

function escapeFtsTerm(value: string): string {
  return `"${value.replaceAll('"', '""')}"*`;
}

export function createPricingSearchPlan(query: string): PricingSearchPlan {
  const normalized = normalizeSearchText(query);
  const logicalTokens = unique(normalized.split(" ").filter(Boolean));
  const interpretations: PricingSearchInterpretation[] = [];
  const tokens = logicalTokens.map((token) => {
    const structured = structuredAlternatives(token);
    if (structured.canonical && structured.canonical !== token) {
      interpretations.push({
        input: token.toUpperCase(),
        canonical: structured.canonical.toUpperCase(),
        message: `Understood ${token.toUpperCase()} as ${structured.canonical.toUpperCase()}`,
      });
    }
    return {
      token,
      alternatives: unique([token, ...structured.alternatives]),
    };
  });
  return {
    normalized,
    tokens,
    ftsQuery: tokens
      .map((token) =>
        token.alternatives.length === 1
          ? escapeFtsTerm(token.alternatives[0])
          : `(${token.alternatives.map(escapeFtsTerm).join(" OR ")})`,
      )
      .join(" AND "),
    interpretations,
  };
}

export function tokenPlanMatchesText(
  token: PricingSearchTokenPlan,
  normalizedText: string,
): boolean {
  const candidateTokens = normalizedText.split(" ").filter(Boolean);
  return token.alternatives.some((alternative) =>
    candidateTokens.some(
      (candidate) =>
        candidate === alternative ||
        candidate.startsWith(alternative) ||
        candidate.includes(alternative),
    ),
  );
}
