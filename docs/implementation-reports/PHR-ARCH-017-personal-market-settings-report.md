# PHR-ARCH-017 — Personal Market Providers And Cost Structure Implementation Report

Date: 2026-08-07

Status: **IMPLEMENTED AND PRIVATELY LIVE — PRODUCT REVIEW READY**

Every active permanent member now has a separate `/user-settings` workspace reached through `My settings` in the account menu. It does not broaden Administration, reveal credentials, or depend on a product-module entitlement. Pending, disabled, anonymous, compatibility, and timed-worker identities cannot read or mutate personal settings.

All four current providers are included and enabled by default. A member can keep at least one provider enabled; Vendor Workspace then hides disabled evidence/history and prevents hidden TCGplayer data from silently driving its visible offer reference. PriceCharting remains optional and subordinate.

Personal nullable cost and target overrides are stored by workspace/user in the authentication database and merged over workspace regional policy. Empty fields inherit; explicit zero remains zero. Official BCB PTAX facts remain workspace-owned. Regional candidate and availability-verification routes use the active permanent member's effective profile. Each update emits a secret-free authorization audit record.

The phone-focused settings surface uses two tabs—Market providers and Cost structure—rather than stacking Administration panels. Focused authorization/persistence tests, all 470 tests, TypeScript, warning-free lint, production build, gateway probes, live additive migration, and database integrity pass.
