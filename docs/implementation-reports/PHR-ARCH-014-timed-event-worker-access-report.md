# PHR-ARCH-014 Implementation Report

Implemented a separate event-worker authentication boundary: SQLite grants, one-time codes, timed hashed sessions, throttling, audit, revocation, permanent-identity-first authorization, permanent-identity-only administration APIs, Settings management, and mobile worker login.

Temporary grants allow only `VENDOR_WORKSPACE` and `INVENTORY` at `VIEW` or `OPERATE`. They never satisfy identity-required endpoints or create Better Auth users/memberships.

Verification: `docs/testing/PHR-ARCH-014-timed-event-worker-access-validation.md`.
