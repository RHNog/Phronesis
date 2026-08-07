# PHR-WORKFLOW-017 Implementation Report

Implemented an `Event team` surface inside the current active Event Ledger. It clearly separates permanent approved-account access from event-bound temporary-worker access and explains that neither changes the immutable product-owner roster established at event opening.

Permanent management deep-links to Settings → People & access. Pending approvals and direct invitations now provide an `Event Ledger only` preset, while each existing membership provides a one-action `Add Event Ledger` helper. The helper persists `EVENT_LEDGER:OPERATE` immediately, preserves every existing entitlement, and is observed by the next protected request without event restart or sign-out.

Temporary management reuses `EventAccessManagement` in an Event Ledger-only variant. The embedded form stays collapsed until requested, submits exactly `EVENT_LEDGER:OPERATE` for the current active event, and lists only that event's Ledger grants. Existing single-use code, salted hash, expiry, revocation, rotation, throttling, audit, session-cookie, and event-close invalidation behavior remains authoritative.

The Event Ledger Server Component separately evaluates permanent `ADMINISTRATION:ADMIN` authority. Compatibility and temporary principals cannot manage access; compatibility mode receives a direct permanent-owner sign-in action. Closed historical reports never render live team controls.

No authorization table, event copy, synthetic account, worker grant, test identity, or live ledger mutation was added. The existing private service was rebuilt and restarted with the live authorization, recognition, and pricing databases unchanged.

Verification is recorded in `docs/testing/PHR-WORKFLOW-017-ongoing-event-team-access-validation.md`.
