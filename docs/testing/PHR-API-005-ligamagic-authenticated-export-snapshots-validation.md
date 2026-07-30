# PHR-API-005 Validation Record

Date: 2026-07-30
Verdict: **PASS — COMPLETE DRY RUN; SCHEDULE GATED**

## Authenticated browser boundary

- Read-only inspection confirmed the TCGPlayer Pricing Tool's working pattern: ordinary Chrome performs manual login in a dedicated persistent profile; Playwright attaches over CDP only after authentication.
- LigaMagic reproduced that pattern successfully on isolated debug port `9225`.
- No Safari/default-Chrome cookie store, password, token, header, request body, or query value was read or copied.

## Supervised pilot

- Run: `pilot-20260730T202522988Z`.
- Collection: `Lote 1 (9.396 cards)`.
- Result: 9,396 rows and 9,396 cards; 1,335,371 bytes.
- SHA-256: `11509ae02cdcb3dcbd59f0a864c02c2314bbe0cdc58073f0a94cdbc8f1cb943d`.
- Supported export behavior: authenticated `POST` to LigaMagic `/` with `view` and `id` query keys; HTTP 200 CSV attachment response. Captured evidence excludes query values and request/session material.
- Required format: `Padrão LigaMagic CSV [Modelo para Coleções]`. The shorter `Padrão LigaMagic CSV` produced a price-free 13-column file and was rejected before snapshot use.

## Complete dry run

- Run: `dry-run-20260730T203243818Z`.
- Checkpoint: 2026-07-30T20:32:43.819Z through 2026-07-30T20:35:52.915Z.
- Collections: 37/37.
- Advertised cards: 329,976; exported quantity: 329,976.
- Source rows: 329,903.
- Unique identities: 329,301.
- Identical duplicate memberships: 602.
- Conflicting duplicate prices: 0.
- SQLite SHA-256: `0eb89b4efc0ab997e78256ec7c87cbaf020a9b4b41f51f4891e9308e2394800d`.
- Manifest SHA-256: `8d8c4e95e22c9f1d37a942025fe660b164296c8cc6c404b56c73af86d8dc086f`.

## Price coverage

- Consumer/`Compra`: low 257,209; average 255,228; high 257,209 identities.
- Store-buy/`Venda`: low 248,857; average 256,338; high 267,525 identities.
- Zero values remain unavailable evidence and are not promoted into prices.

## Repository verification

- `npm test`: 238/238 passed.
- `npx tsc --noEmit`: passed with zero diagnostics.
- `npm run lint`: passed after explicitly excluding ignored `.data/**` browser/evidence content.
- `npm run build`: passed.
- `git diff --check`: passed.

## Negative-effect declaration

No automated login, CAPTCHA bypass, cookie copying, anonymous scraping, marketplace-page scraping, canonical pricing activation, schedule installation, provider mutation, marketplace transaction, public deployment, commit, push, or publication occurred.

Same-session Chief Architect conformance found the implementation consistent with `PHR-API-005`. This is not independent approval.
