# PHR-ARCH-016 Implementation Report

Implemented email/password account creation and sign-in through Better Auth while retaining optional GitHub identity. New identities create one Phronesis-owned pending access request and no membership. Authenticated people without a membership land on a waiting page instead of receiving optional compatibility access.

Settings now loads pending accounts beside active memberships. An Administration Admin can verify a person out of band, choose a non-Owner role, select at least one exact module/access pair, and approve or reject. Approval atomically creates the membership and entitlements and writes an audit record; rejection creates no access. Direct invitation/activation remains available as an alternative.

The shell now shows the active identity, conditional Settings, and logout. Password rules require 12–128 characters, implicit account linking is disabled, and error copy does not disclose account existence. Email verification, reset delivery, passkeys, and MFA remain gated.

Verification is recorded in `docs/testing/PHR-ARCH-016-trusted-account-registration-validation.md`.
