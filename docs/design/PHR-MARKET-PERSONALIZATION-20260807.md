# Designer Direction — Provider History And My Settings

## Product Hierarchy

The selected identity stays first. Current TCGplayer/Liga evidence answers `What is it worth now?`; history answers `How has that provider moved?`; PriceCharting remains optional graded corroboration below. Personal configuration belongs in the account menu, never inside Administration navigation for ordinary users.

## Vendor Price History

- Keep the approved combined TCGplayer/Liga raw-card card.
- Place `Price movement` after current TCGplayer/Liga values and before `Track price`.
- Use provider buttons only for providers applicable to the selected game and enabled by the user.
- Use four range controls exactly: `7D`, `30D`, `3M`, `1Y`.
- Show the current value, retained first-to-latest percentage, observation count, and explicit currency as text before the chart.
- Use a restrained SVG with labeled legend swatches. Do not depend on green/red or hover.
- If only one point exists, show the point and `History begins here`; do not draw an invented flat trend.
- Keep PriceCharting history inside the closed-by-default violet disclosure so graded evidence never precedes raw-card evidence.
- Minimum touch target is 44 pixels and controls wrap into a two-row phone layout without horizontal scrolling.

## My Settings

- Account menu label is `My settings`; the existing admin route is `Administration settings`.
- Lead with `Your market workspace`, followed by provider cards and personal cost structure.
- Each provider card has a native checkbox, provider name, evidence purpose, game scope, and `Included for now` state.
- Cost structure uses two direction sections: `US → Brazil` and `Brazil → US`, with an `Evidence freshness` field after them.
- Every optional input explains `Blank uses workspace default` and shows the current effective value.
- Use one sticky-safe `Save my settings` action in normal document flow; do not use a modal.
- Saving has pending, success, validation, and failure states in an `aria-live` region.

## Search Correction

- Show one concise interpretation directly under search help: `Did you mean Gardevoir? Showing matches for Gardevoir.`
- Keep the result list and explicit selection unchanged.
- Do not show a suggestion when the correction is ambiguous or when literal search already returned candidates.

## Risk States

- Compatible distribution proxy: `Comparison proxy — special release treatment not represented by LigaPokémon`; include confidence and keep it out of Arbitrage.
- No retained history: `No observations in this range.`
- Provider disabled: omit its market panel and offer a quiet `Manage providers in My settings` link where all applicable raw providers are disabled.
- Inherited cost: label it `Workspace default`, never `0` or `Not configured` unless the effective value is actually null.
