# PHR-UX-012 — Provider Connections And Regional Acquisition Health

- Added LigaMagic and LigaPokémon as the first Provider Connections group.
- Connected both Liga cards to the existing private recurring-acquisition receipt without exposing profiles, credentials, cookies, or configuration values.
- Added configuration, schedule, last-completed, snapshot, promotion, and sanitized outcome details.
- Added a live **Refresh status** action with accessible completion and failure feedback.
- Grouped valuation feeds explicitly and placed PriceCharting immediately after JustTCG, before eBay Browse and CardTrader.
- Preserved encrypted owner-only setup for credential-backed providers and kept Liga authentication in isolated local browser profiles.
- Restricted provider health to Administration view authorization.
- Deployed the revision to the private Admin service at `https://ramons-mac-studio.tailaa2d39.ts.net:9444/settings?panel=providers`.
