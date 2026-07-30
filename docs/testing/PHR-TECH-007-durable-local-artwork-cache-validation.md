# PHR-TECH-007 Validation Record

Date: 2026-07-29
Verdict: **READY FOR PRODUCT REVIEW**

## 2026-07-30 Runtime Remediation Validation

Verdict: **PASS — CTO ACCEPTED FOR CANONICAL ADOPTION**

- Reproduced the exact Mox Opal failure: the strict resolver returned eight SKU mappings, but `/api/pricing/image` returned HTTP 502 because Scryfall rejected Node's generic User-Agent with HTTP 400 `generic_user_agent`.
- After remediation, the same Phronesis URL returned HTTP 200, `image/jpeg`, 13,622 bytes, source host `cards.scryfall.io`, and a verified local cache record.
- Reproduced the exact Lorcana failure: Lorcast returned zero results for `Mulan - Resourceful` / `Mulan - res` punctuation but returned both Winterspell printings for `Mulan Resourceful Recruit`.
- After remediation, `/api/pricing/artwork?category=lorcana-en&q=Mulan+-+res` returned three strict SKU mappings covering collector numbers 69 and 229; both rendered through locally retained AVIF assets.
- Twelve representative small/normal Mox Opal and Mulan assets were prewarmed; all returned HTTP 200.
- Focused cache and resolver suite: **11/11 passed**.
- Supported full suite: **187 passed / 17 unchanged baseline failures** out of 204. The new focused regression increases the passing baseline by one; no artwork test fails.
- `npm run lint`, `npm run build`, and `git diff --check`: passed.
- Standalone `npx tsc --noEmit`: only the established **29 `TS5097`** test-import configuration errors; no application or remediation error.
- Private runtime: Mox Opal displayed 4 strict images and 3 honest placeholders; both `Mulan - Resourceful Recruit` artwork groups displayed. Desktop and 390×844 mobile checks passed with no horizontal overflow (`390px` viewport, `375px` document width).
- Private review service and tailnet-only mapping remained healthy after verification.

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
