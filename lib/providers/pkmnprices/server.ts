import { getPricingRepository } from "@/lib/pricing/server";
import {
  PkmnPricesSealedClient,
  PkmnPricesSealedRepository,
  PkmnPricesSealedSync,
  PokemonReleaseSource,
} from "@/lib/providers/pkmnprices/PkmnPricesSealed";
import { getProviderCredential } from "@/lib/providers/credentials";

export function pkmnPricesSealedConfigured(): boolean {
  return Boolean(getProviderCredential("pkmnprices-sealed", "PKMNPRICES_API_KEY"));
}

export function getPkmnPricesSealedRepository(): PkmnPricesSealedRepository {
  return new PkmnPricesSealedRepository(getPricingRepository().database);
}

export function getPkmnPricesSealedSummary() {
  return getPkmnPricesSealedRepository().summary({
    configured: pkmnPricesSealedConfigured(),
  });
}

export function createPkmnPricesSealedSync(): PkmnPricesSealedSync {
  const apiKey = getProviderCredential("pkmnprices-sealed", "PKMNPRICES_API_KEY");
  return new PkmnPricesSealedSync(
    getPkmnPricesSealedRepository(),
    new PokemonReleaseSource(),
    apiKey ? new PkmnPricesSealedClient(apiKey) : null,
  );
}
