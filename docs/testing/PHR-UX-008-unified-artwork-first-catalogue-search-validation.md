# PHR-UX-008 Validation Record

Date: 2026-07-29
Verdict: **READY FOR PRODUCT REVIEW**

## Search and grouping

- The catalogue selector is removed from Vendor Workspace; `/api/pricing/search` searches all active categories when no category is supplied and retains category-specific compatibility when one is supplied.
- Results are globally ranked, bounded, and labelled by game.
- Finish-only products with the same category, normalized name, set, collector number, and language collapse into one artwork group.
- Alternate-art descriptors, distinct collector numbers, languages, and sealed products remain distinct.
- Selecting a group exposes Finish before Condition and selects the exact underlying SKU. Changing finish resets asking price and recalculates from the exact variant.

## Runtime evidence

- Desktop 1440x1000: three-column station, document width 1425px equals scroll width, 10 loaded Pokémon images, zero failed image elements, visible game badges, and Holofoil/Reverse Holofoil choices on one Arceus Charizard artwork.
- Mobile 390x844: one-column flow, document width 375px equals scroll width, the same 10 images loaded, zero failed image elements, and the same two finish choices.
- Current state reports three loaded catalogues while search routes automatically across all five registered categories.
- Browser console contained only Chrome extension transport noise (`Receiving end does not exist`), not an application exception.

## Verification

- Focused provider/search/artwork suite: **18/18 passed**.
- Identity registry/provider suite: **7/7 passed**.
- Lint, application build/type check, and diff check passed.
- Full suite retains the documented **173-pass / 17-failure** baseline.

## Negative-effect declaration

No buying formula, Business Profile, Strategy, Asset Assessment, Intelligence model, Offer Ladder, Decision Resolver, price acquisition, upstream schedule, or catalogue file was changed. Mobile remains an adaptation of the same desktop-first workflow.
