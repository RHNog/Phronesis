# PHR-UX-024 — Sealed Artwork Review Queue Validation

## 2026-08-02 Packaging Gallery Amendment

### Result

Pass — Shared-SKU Packaging Gallery Implemented And Live

### Automated Evidence

- Focused artwork-review and Vendor Workspace suite: 16/16 pass.
- Full repository suite: 370/370 pass.
- `npx tsc --noEmit --incremental false`: pass.
- `npm run lint`: pass with no warnings.
- `npm run build`: pass on Next.js 16.2.12; `/artwork-review` remains present.
- `git diff --check`: pass.

### Behavioral Evidence

- Gallery acceptance requires at least two active, allow-listed candidates for the same current SKU identity.
- Acceptance stores one ordered gallery transactionally, retains a stable first-image thumbnail, and records every selected source in append-only evidence.
- Repeating the same acceptance is idempotent; an active gallery blocks conflicting single-candidate mutations.
- Product-level undo removes only the matching gallery resolution and rows in one transaction while retaining the audit trail.
- The artwork API returns an ordered gallery plus `OWNER_APPROVED_PACKAGING_GALLERY` provenance; Vendor Snapshot Evidence cycles the images without changing the selected product.
- The carousel exposes labelled previous/next controls, an `aria-live` position indicator, and hover/tap enlargement through the existing preview component.

### Runtime And Data Evidence

- Active gallery: `Fossil Booster Pack [1st Edition]`, SKU `tcg:86ade0ff4771fdd788131f39`.
- Ordered sources: Aerodactyl, Lapras, and Zapdos Fossil booster wrappers.
- Active summary: 364 exact, 118 assisted representative, 14 owner representative, 1 packaging gallery, 497 visible, 878 pending, and 2,894 total sealed products.
- The distinct Unlimited SKU was not mutated because all three source files contain 1st Edition wrapper evidence.
- The live artwork endpoint returned all three durable URLs in order and gallery provenance; private `/artwork-review` and `/vendor` returned HTTP 200 and the existing tailnet mapping remained healthy.

### Safety Evidence

- One market SKU remains one product identity; the gallery does not create synthetic identities or duplicate price observations.
- Separately priced TCG-derived variants remain separate SKUs.
- No exact or curated artwork was overwritten, and no public deployment, commit, or push occurred.

## Result

Pass — Assisted Recovery Applied; Product Review Ready

## Automated Evidence

- Focused sealed-review suite: 6/6 pass, including deterministic policy and assisted idempotency.
- Full repository suite: 368/368 pass.
- `npx tsc --noEmit`: pass.
- `npm run lint`: pass with no warnings.
- `npm run build`: pass on Next.js 16.2.12; the Administration review route is present.
- `git diff --check`: pass.

## Data Evidence

- Active private database: 2,894 Pokémon sealed products.
- Exact artwork remains 356 (12.30%).
- Assisted representative artwork: 118 (4.08%).
- Visible sealed artwork: 474 / 2,894 (16.38%).
- Remaining pending review products: 901.
- The assisted dry run considered 1,084 source-ambiguous products, selected 118, and rejected 966 from automation: 421 mixed-product guesses, 504 value-sensitive/composite variants, and 41 package variants.
- Apply completed in 1.802 seconds; an idempotency rerun applied zero rows and recognized all 118 as already current.
- No paid request or eager candidate-image prefetch occurred.

## Behavioral Evidence

- Candidate restaging is idempotent and preserves append-only review events.
- Exact artwork blocks representative approval.
- Accept creates `OWNER_APPROVED_REPRESENTATIVE` provenance; undo removes only that matching representative mapping.
- Assisted apply creates `ASSISTED_REPRESENTATIVE` provenance with policy `v1`, an explicit rationale, and actor `phronesis-assisted-review:v1`.
- Owner undo also reverses an assisted representative without touching exact artwork.
- Reject and restore persist independently.
- Candidate image reads use the Administration-authorized durable cache and an approved source URL.
- Vendor Workspace receives and displays the representative-image warning.

## Runtime Evidence

- Private Settings returned HTTP 200 after the build/restart gate.
- The accepted-state Administration endpoint returned 118 items and the exact 356 / assisted 118 / visible 474 / pending 901 summary.
- A returned Aquapolis representative identifies the immutable source path and the accepted audit timestamp.

## Safety Evidence

- No paid API, scraping, broad confidence-only acceptance, public deployment, commit, or push occurred.
- No exact artwork was overwritten.
- SQLite evidence contains exactly 118 `ASSISTED_REPRESENTATIVE` provenance rows, 118 `ptcg-assets-assisted-review` resolutions, and 118 v1 audit events.
