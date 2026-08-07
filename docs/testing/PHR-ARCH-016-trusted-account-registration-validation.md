# PHR-ARCH-016 Validation

Date: 2026-08-06

Result: Pass — implemented and privately live; unattended restart persistence gated.

## Automated evidence

- `tests/authorization-foundation.test.ts` proves pending account creation, zero-membership denial, same-workspace owner approval, exact selected entitlements, rejection without membership, unsafe Owner/zero-module denial, and duplicate-request audit behavior.
- The full supported suite passes: 437/437.
- `npx tsc --noEmit`: pass.
- `npm run lint`: pass with no warnings.
- `npm run build`: pass on Next.js 16.2.12, including `/sign-up`, `/sign-in`, `/access-pending`, and `/api/administration/access-requests`.

## Isolated end-to-end evidence

- Better Auth email/password registration created one user, one `PENDING` access request, and zero memberships.
- The new account was automatically signed in and landed on `/access-pending` with an explicit zero-module explanation.
- An isolated Owner saw the request in Settings, selected only `ARTWORK_REVIEW:VIEW`, and approved it.
- SQLite then reported `VIEWER`, exactly one `ARTWORK_REVIEW:VIEW` entitlement, and `APPROVED` request state.
- The approved account saw one authorized tool, Artwork Review, and no Settings.
- Sign-up, dashboard, and owner Settings had no horizontal overflow at 390×844; owner Settings also passed at 1440×900.
- Synthetic accounts and their temporary database were not written to the live store and were moved to Trash after validation.

## Live private evidence

- A SQLite online backup passed `PRAGMA integrity_check` before migration.
- The additive live migration created `phronesis_access_request`, preserved the one existing membership, and left the database integrity result `ok`.
- The first scanner-review restart completed without new error-log bytes. After the final production rebuild, macOS 27 launchd repeatedly stalled before opening the external-volume application path and produced no application error. Database integrity remained `ok`.
- The live service was recovered into the named detached `phronesis-scanner-review` screen session; loopback `3200` and private tailnet `9444` returned `200` afterward. The existing LaunchAgent definition is retained but booted out for the current login session so it cannot compete for port `3200`.
- Loopback `/sign-up` and private tailnet `/sign-up` return `200`.
- Live sign-in exposes permanent account sign-in and `Create one`; unauthenticated access-request administration returns `401`.
- Live 390×844 browser review confirms the create-account action, owner-approval copy, and no horizontal overflow.

## Residual gates

- Submitted email is not independently verified. The owner must verify the person out of band before approval.
- Password reset, verified-email delivery, passkeys, and MFA are not included.
- Custom-domain public activation remains gated under `PHR-TECH-016`.
- Reboot/login persistence for the external-volume scanner-review runtime requires a separate macOS Files & Folders/Full Disk Access decision or an internal-volume runtime deployment. The current detached process remains available during the active login session.

## 2026-08-06 Sign Up Invite Revision

- Origin tests prove active restricted-public precedence, disabled/inactive public fallback, private-origin URL construction, and relative pre-hydration safety.
- Static UI contracts prove the generic invite contains Copy, supported-device Share, Preview, zero-access disclosure, 44-pixel controls, and no activation code, email, role, or module query.
- Focused trusted-account, Settings, restricted-gateway, resilient-copy, and card-show coverage: 35/35 pass.
- Full supported suite: 443/443 pass.
- Standalone TypeScript, warning-free lint, Next.js 16.2.12 production build, and diff hygiene pass.
- Live desktop 1280×720 review measured a 623-pixel invite card with three 44-pixel actions and no horizontal overflow (1,265 document pixels within 1,280).
- Live phone 390×844 review measured a 301-pixel card, three 44-pixel actions, and no horizontal overflow (375 document pixels within 390).
- The Copy action produced visible `Sign Up link copied` / `Copied to clipboard` confirmation; Share appeared on the supported browser; Preview targeted the exact displayed URL.
- The configured future custom domain failed DNS resolution during read-only validation. Because `PHRONESIS_RESTRICTED_PUBLIC_MODE` is not enabled, the live card correctly selected `https://ramons-mac-studio.tailaa2d39.ts.net:9444/sign-up`, which returns HTTP 200.
- Browser warning/error count: zero. No account, access request, membership, entitlement, invitation code, message, or public infrastructure was created.

## 2026-08-07 No-Client Public Activation

- People & access now displays exactly `https://ramons-mac-studio.tailaa2d39.ts.net:10000/sign-up` while public mode is enabled.
- An isolated migrated production database proved registration, secure session issuance, pending-room access, and zero-module root redirection through restricted ingress; the temporary identity/database were removed.
- A live public registration request reached Better Auth's normal password validation instead of failing origin validation and created no probe account.
- Distributed public checks returned Sign Up `200`; public Settings remained `404`; private Scanner-to-Offer and Event Ledger remained `200`; live SQLite integrity remained `ok`.
- Focused gateway/auth 18/18, full 458/458, TypeScript, warning-free lint, and production build pass. Detailed transport evidence is in `docs/testing/PHR-TECH-016-restricted-public-custom-domain-ingress-validation.md`.
