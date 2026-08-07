# PHR-API-017 — Provider Price History And Movement Implementation Report

Date: 2026-08-07

Status: **IMPLEMENTED AND PRIVATELY LIVE — PRODUCT REVIEW READY**

Phronesis now projects retained TCGplayer, LigaMagic/LigaPokémon, and PriceCharting observations through one bounded read-only history contract. Each provider, evidence lane, currency, observation time, source receipt/run, and Liga match quality remains explicit. The response supports 7D, 30D, 3M, and 1Y and retains no more than 366 chronological points per series.

Vendor Workspace replaced its one previous-price sentence with a responsive provider history card inside raw-card evidence. The four range controls, provider controls, and lane selector are keyboard accessible and at least 44 pixels high. One retained point says `History begins here`; empty ranges remain empty. PriceCharting history stays inside its lazy, closed-by-default disclosure below the TCGplayer/Liga card.

The additive live backfill retained 777,509 LigaMagic and 191,775 LigaPokémon lane observations. Existing TCGplayer and applied PriceCharting receipt history remain provider-owned and are projected in place. No external request is made when the user changes a range, provider, or lane.

Focused history/UI tests, all 470 repository tests, TypeScript, warning-free lint, the Next.js 16.2.12 production build, database integrity, live provider switching, and 390-pixel no-overflow/44-pixel control checks pass. The private runtime serves the release at `https://ramons-mac-studio.tailaa2d39.ts.net:9444/vendor`.
