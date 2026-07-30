# PHR Card-Show Operations Engineer Report

Date: 2026-07-30
Assignment: `PHR-CARD-SHOW-OPERATIONS-20260730`
Status: **CTO ACCEPTED** at local checkpoint `6c38c1f`

## Outcome

Phronesis now has truthful catalogue-first watch refresh, an intentional manual watch composer, offer-first buying guidance, secure module-scoped employee activation foundations, a persistent event purchase ledger with Bulk, and exact local recovery for otherwise missing product artwork.

## Implementation summary

- Reconciles legacy watches to unique physical catalogue identities, preserves last-good evidence on failure, returns structured errors, and reports secret-free provider health.
- Manual/global tracking collects a target or explicit no-target choice plus optional notes/reason; Vendor Workspace retains one-action tracking.
- Buying Decision shows recommended, opening, target, and walk-away offers immediately; seller ask is optional comparison.
- Employee invitations select module access before issuance and return a single-use activation code once. Only salted hashes persist; GitHub remains the installed identity proof and required mode stays gated.
- Event checkout persists exact and mixed Bulk cart lines into idempotent immutable receipts with operator ownership and audited voids.
- Artwork queries are bounded per visible Pokémon/Lorcana identity. Exact-SKU curated local images cover sealed or special products when providers lack reliable media.
- eBay can mint and cache its own application token from client ID/secret; static token fallback remains supported.
- The pricing observer now imports node-safe repository access and remains alive after service restart.

## Verification

See `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`. All deterministic gates pass and the private service is active.

## Remaining activation work

Required employee login still needs owner bootstrap, GitHub OAuth credentials/callback verification, and the existing security gate. JustTCG enrichment is configured but disabled; eBay and CardTrader credentials are absent. Those are visible configuration states, not application regressions.
