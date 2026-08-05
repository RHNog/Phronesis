# PHR Local Card Recognition — Chief Architect Conformance Review

## Review Status

`CONFORMS FOR PRIVATE OPERATION — CALIBRATION, CONSUMER ADOPTION, AND PUBLIC RELEASE GATES REMAIN CLOSED`

This is a same-session conformance review and is not represented as independent approval.

## Conformance

- Phronesis retains canonical identity, pricing, offer, operator, and export authority.
- Windows owns only acquisition and sealed transfer; the local Vision worker owns only derived recognition evidence.
- Originals are immutable and content-addressed; retries are idempotent and jobs recover after lease expiry.
- Multi-region geometry and append-only corrections preserve the original frame.
- Candidate evidence is deterministic and game-gated. Machine output defaults to review/abstention.
- Condition and finish are operator confirmed; exact-condition price evidence is read-only and server-revalidated.
- Recognized Asset Envelope v1 is canonical, hash-bound, duplicate/staleness checked, and publication-free.
- The TCGplayer/Liga adapters are pure draft transformations; no external repository was changed.

## Findings

The real Pokémon batch initially revealed a cross-game false-positive caused by the generic `BASIC` header. The pipeline correctly limited it to `REVIEW`, but that recommendation was still operationally poor. An explicit observed-game classifier prevented unsupported Pokémon evidence from querying the then-active Magic catalogue. That historical replay produced 18 safe abstentions; the later Pokémon-first revision is reviewed below.

No claim is made that OCR-only retrieval meets product accuracy. Apple Vision feature prints are generated and versioned, but the catalogue-scale artwork index remains disabled until source licensing/provenance and holdout gates are satisfied. Automatic binder segmentation is also not claimed; the implemented region contract and correction history are the safe extension foundation.

## Next Accountable Gate

The privately activated package is ready for Product Owner use on the tailnet. Auto-accept requires a separately approved corpus and powered English Pokémon holdout. TCGPLAYER Tools and Liga consumer adoption, public deployment, push, and publication remain separate controlled changes.

## 2026-08-05 Private Activation Review

`CONFORMS — TAILNET-ONLY OPERATIONAL PATH VERIFIED`

At the private-activation checkpoint, the isolated `:9444` service and recurring recognition worker were supervised by user LaunchAgents and did not modify the existing `:9443` or public `:10000` routes. The then-active Magic policy retained its correct 18/18 Pokémon abstention result, immutable evidence bytes, zero pending jobs, and quiet idle polling. Durable state reconciliation derives `PROCESSING`, `REVIEW`, and `OFFER_READY` from current jobs and operator resolutions; the session correctly transitioned from stale `PROCESSING` to `REVIEW`. Phone-width browser evidence showed no horizontal overflow, 44px actions, and no console warnings/errors. Full 415/415 tests, zero-warning lint, and production build passed. This historical checkpoint is superseded by the Pokémon-first revision review below and remains a same-session review, not independent approval.

## 2026-08-05 Calibration Tooling Review

`CONFORMS — REAL CORPUS QUALIFICATION AND RELEASE GATES REMAIN CLOSED`

The implementation now turns explicit local source files into checksum-verified bundles and produces reproducible benchmark reports without assuming that source possession grants recognition or redistribution rights. Identity and identical-byte leakage across partitions fail before bundle writes. Benchmark cases cannot change the manifest's split or expected identity, and one asset cannot be replayed to inflate statistical power. Qualification requires corpus readiness plus minimum holdout, accepted-result, precision, and per-stratum evidence. Synthetic tests, 409/409 repository tests, 2/2 Swift tests, TypeScript, zero-warning lint, and production build pass. This remains a same-session review and is not independent Product Owner acceptance.

## 2026-08-05 Binder Segmentation Tooling Review

`CONFORMS AS BENCHMARK TOOLING — PRODUCTION SEGMENTATION DOES NOT CONFORM YET`

The native worker and TypeScript boundary preserve local-only execution, versioned evidence, top-left normalized geometry, deterministic order, and fail-closed validation. The benchmark excludes synthetic cases from qualification and prevents reuse of frames or labels. No detector output mutates active regions. The real smoke result is a known false localization, not positive accuracy evidence. Production activation remains blocked until an approved, immutable, representative binder holdout meets all configured thresholds and returns through Designer and Product Review. Full 414/414 repository tests, 4/4 Swift tests, TypeScript, zero-warning lint, production build, and diff hygiene pass. This is a same-session review, not independent approval.

## 2026-08-05 Pokémon-First Revision Review

`CONFORMS FOR PRIVATE POKÉMON OPERATION — AUTO-ACCEPT AND PUBLICATION GATES REMAIN CLOSED`

The default worker now has one explicit active lane, English Pokémon. Game and language classification occur before catalogue retrieval; backs, Spanish evidence, Magic, and unknown evidence fail closed. Candidate identity retains the catalogue name, set, collector number, variant, and language, and the operator must select one labelled SKU. The server rejects a finish that differs from the selected catalogue variant. Immutable replay is append-only and idempotent, while current session, review, resolution, and offer projections exclude superseded revisions.

Live evidence matches the approved acceptance boundary: 36 retained regions/decisions across two revisions, with the 18 current regions producing eight reviews and ten abstentions. No result was auto-accepted and no purchase, inventory, consumer, or publication mutation occurred. Both private services are supervised and the existing private/public Tailscale routes are unchanged. Full 416/416 tests, TypeScript, zero-warning lint, production build, live API evidence, and phone-width UI evidence pass. This is a same-session conformance review and is not represented as independent approval.
