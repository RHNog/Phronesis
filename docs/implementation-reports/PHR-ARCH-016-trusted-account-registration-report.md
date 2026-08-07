# PHR-ARCH-016 Implementation Report

Implemented email/password account creation and sign-in through Better Auth while retaining optional GitHub identity. New identities create one Phronesis-owned pending access request and no membership. Authenticated people without a membership land on a waiting page instead of receiving optional compatibility access.

Settings now loads pending accounts beside active memberships. An Administration Admin can verify a person out of band, choose a non-Owner role, select at least one exact module/access pair, and approve or reject. Approval atomically creates the membership and entitlements and writes an audit record; rejection creates no access. Direct invitation/activation remains available as an alternative.

The shell now shows the active identity, conditional Settings, and logout. Password rules require 12–128 characters, implicit account linking is disabled, and error copy does not disclose account existence. Email verification, reset delivery, passkeys, and MFA remain gated.

Verification is recorded in `docs/testing/PHR-ARCH-016-trusted-account-registration-validation.md`.

## 2026-08-06 Sign Up Invite Revision

People & access now leads with one generic permanent-account invitation. The owner can inspect the exact `/sign-up` URL, copy it through the established iPhone-safe control, open the native Share sheet when supported, or preview the registration page.

The link contains no token, email, role, module, workspace identity, or approval. A recipient still creates a zero-access pending account and requires out-of-band owner verification plus exact module approval.

Link origin selection is deployment-aware. A validated restricted-public origin is advertised only when `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED`; otherwise the hydrated current private origin is used. The original 2026-08-06 validation proved that the configured future `access.phronesis.com` name did not resolve, so that release correctly retained the working tailnet `/sign-up` URL instead of publishing a broken address.

## 2026-08-07 No-Client Public Activation

`PHR-TECH-016` now supplies an externally verified restricted-account origin at `https://ramons-mac-studio.tailaa2d39.ts.net:10000`. Public mode is enabled for that origin, so the unchanged invite component advertises the working no-client Sign Up route. Registration, pending state, membership approval, and exact module authorization remain unchanged; the future `access.phronesis.com` hostname is still withheld.
