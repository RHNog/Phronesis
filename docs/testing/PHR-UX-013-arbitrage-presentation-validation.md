# PHR-UX-013 — Arbitrage Presentation Validation

## 2026-08-07 — Vendor Evidence Composition Restoration

- All 461 repository tests pass. Focused coverage verifies newest exact matched evidence for both LigaMagic and LigaPokémon, provider/run provenance, condition/language preservation, unsupported-category fail-closed behavior, one combined raw-card card, and lazy PriceCharting placement.
- Standalone TypeScript, warning-free ESLint, the Next.js 16.2.12 production build, and diff hygiene pass.
- The deployed Magic evidence Route Handler returns `LigaMagic`, card `+2 Mace`, and last-good run `dry-run-20260730T203243818Z` observed `2026-07-30T20:35:52.915Z`.
- The deployed Pokémon evidence Route Handler returns `LigaPokémon`, card `AZ`, run `dry-run-20260805T070105248Z`, and exact `Reverse Holofoil · NM · EN` source material observed `2026-08-05T07:03:05.790Z`.
- Live Vendor Workspace review confirms Pokémon renders `TCGplayer + LigaPokémon pricing`, then the provider evidence and closed PriceCharting disclosure; Magic renders the equivalent LigaMagic stack and resets PriceCharting closed on the new selection.
- Expanding PriceCharting changes the summary from `Expand` to `Collapse`, then resolves live graded candidates. Closed initial state contains no graded content, matching the guarded fetch contract.
- At the live 1280×720 review, the selected evidence column is 364.22 pixels wide. Both the combined card and PriceCharting disclosure report equal client/scroll widths (`362/362`), and the collapsed summary is 81 pixels high. This supplies a narrow-column no-overflow/touch-target check without claiming a separate emulated phone viewport.
- The private `:9444` service was rebuilt and restarted on the exact `127.0.0.1:3200` listener; the separate public gateway remained untouched.
- No provider acquisition, reauthentication, crosswalk rebuild, credential mutation, transaction, or public deployment occurred.

## 2026-07-31

- The complete 271-test behavioral suite passes, including 17 focused regional intelligence cases.
- Standalone TypeScript, warning-free lint, the Next.js 16.2.12 production build, and diff hygiene pass.
- Two full catalogue rebuilds produce byte-identical reports and fingerprint `8b96e2472cd3504d06a75bc475b158ef8bec5a722f2570b2bb33d133f8c22304`; all 297 ambiguous identities and all 125,365 quarantined catalogue shells remain unadopted.
- The crosswalk accepts 131,869 unique identities and attributes every match to a named deterministic method. Consumer-priced supported coverage is 130,183 of 156,779, or 83.04%; 129,816 accepted identities in the operational review database have two-market price evidence, or 98.44%.
- Target-side audit confirms zero duplicate TCGplayer products among accepted mappings. Seventy-four weaker or tied source collisions are explicit ambiguities rather than silently duplicated mappings.
- Focused catalogue cases cover documented compound treatments, LigaMagic Art/Stat and signature conventions, Art Series Foil shells, one-letter collector suffixes, foil-only Normal mirrors, and target-collision quarantine.
- Desktop review confirms Arbitrage remains the primary Opportunities surface and loaded local evidence renders 50 candidates across both routes.
- A 390×844 mobile review confirms `US → Brazil` presents TCGplayer as acquisition and LigaMagic as exit, while `Brazil → US` visibly reverses those roles, values, currencies, benchmark copy, and target profile.
- Candidate cards distinguish gross proceeds, gross spread, total cost, net profit, profit margin, ROI, target state, evidence blockers, and availability state.
- Settings stacks both route-specific cost and target profiles without horizontal scrolling and preserves empty policy inputs as `No target`.
- Provider registration/status text now wraps within the mobile viewport; document width equals viewport width.
- Existing persisted cost values were preserved. No owner target value, executable availability, credential, or transaction was invented.
