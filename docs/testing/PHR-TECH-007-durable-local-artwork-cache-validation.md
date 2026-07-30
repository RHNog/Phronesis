# PHR-TECH-007 Validation Record

Date: 2026-07-29
Verdict: **READY FOR PRODUCT REVIEW**

## Functional verification

- Official Bandai One Piece search preserves base, parallel, and SP asset identities.
- Strict catalogue resolution selects only evidence-backed product/set, card-number, name, and variant matches.
- The same-origin image route accepts only exact approved HTTPS hosts and paths, validates raster MIME and magic bytes, rejects redirects and oversized bodies, and stores no credentials.
- A first valid request writes immutable image bytes and metadata atomically; a new cache instance serves the same bytes without another provider request.
- Provider failures and ambiguous variants preserve existing placeholders and never alter snapshot prices or buying decisions.
- Twelve unique official images mapped by the active `luffy` search were prewarmed; `.data/artwork/` contains 12 ignored image/metadata pairs.

## Verification results

- Focused Bandai/cache/artwork/identity/workspace/image suite: **23/23 passed**.
- `npm run lint`: passed.
- Application production build/type check: passed.
- Standalone `npx tsc --noEmit`: only **29 `TS5097`** test-import configuration errors; no application or feature error. Two additional occurrences come from the new TypeScript test files and are the same established configuration class.
- Full suite: **180 passed / 17 established baseline failures** out of 197; the failure set is unchanged and no Bandai/cache test fails.
- `git diff --check`: passed.
- Runtime cache: first official image request populated one image/metadata pair; repeat request returned identical SHA-256 bytes from local storage. First observed request took about 1.38s and the cached repeat about 7ms.
- Runtime UI: One Piece images rendered in catalogue results and selected snapshot evidence at desktop and 390px phone widths with no horizontal overflow.

## Authorization and limitations

The Product Owner attested that Bandai authorization is given. This record captures that product authority but is not independent legal verification. No bulk catalogue download, Riot asset, credential creation, Pricing Update Tool mutation, commit, push, deployment, or publication occurred. Riftbound remains authorization gated.
