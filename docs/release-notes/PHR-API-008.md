# PHR-API-008 — PkmnPrices Sealed Ingestion

## 2026-08-01 — Product Review Ready; Activation Gated

- Added a sealed-only PkmnPrices worker that spends at most 100 credits per UTC day, newest Pokémon releases first.
- Added restart-safe usage/cursor persistence, exact-only sealed identity resolution, durable artwork integration, and Settings health.
- Missing credentials or sealed plan access fail closed. No provider credit was consumed during verification because the active key is not configured.
- Verification passes 314/314 tests plus TypeScript, warning-free lint, diff hygiene, and production build.
