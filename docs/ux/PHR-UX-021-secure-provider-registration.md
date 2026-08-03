# PHR-UX-021 — Secure Provider Registration

## Status
Implemented — Product Review Ready

## Objective
Make every Provider connections card an actual owner-controlled setup surface.

## Solution
Authenticated workspace administrators can expand a provider, enter its allowlisted secrets, replace them, or remove them. Secrets—including the PriceCharting Magic and One Piece subscription CSV download URLs—are encrypted with AES-256-GCM in the local authorization database using a key derived from `PHRONESIS_PROVIDER_VAULT_SECRET` or `BETTER_AUTH_SECRET`; reads return presence only and never return plaintext. Environment credentials remain supported and take precedence.

## Acceptance Criteria
- Setup controls are keyboard/touch accessible and unavailable without secure owner authentication.
- Only allowlisted fields are accepted; blank values do not erase an existing secret.
- Plaintext is not returned, rendered after save, logged, or committed.
- Provider health recognizes registered credentials.
- `PRICECHARTING_MAGIC_CSV_URL` and `PRICECHARTING_ONEPIECE_CSV_URL` use the same encrypted, presence-only contract as API tokens and are never returned to provider health or the Settings client.

## Security Boundary
This protects against accidental database disclosure, not compromise of the host and its server secret. Timed event workers cannot access the administration endpoint.

## Traceability
- Prompt: `docs/prompts/PHR-UX-021-secure-provider-registration-prompt.md`
- Implementation: `components/settings/ProviderConnections.tsx`, `app/api/administration/provider-credentials/route.ts`, `lib/providers/credentials.ts`
- Extension: `PHR-API-012` PriceCharting Multi-Game Daily Snapshots.
- Last modified: 2026-08-01
