# PHR-ARCH-011 Validation Record

Date: 2026-07-30
Verdict: **PASS — IMPLEMENTED, ACTIVATION GATED**

## Automated verification

- Identity and navigation-focused tests: **9/9 passed**.
- Supported full suite: **210/210 passed**.
- Standalone TypeScript: passed with zero diagnostics.
- Lint: passed with zero warnings.
- Next.js 16.2.12 production build: passed across 21 routes plus Proxy.
- `git diff --check`: passed.
- Local ignored migration: Better Auth created its four core tables; Phronesis workspace, membership, entitlement, invitation, and audit migrations completed.

## Behavioral verification

- Owner bootstrap invitations create one active, fully entitled membership after the invited identity is provisioned.
- Uninvited identities fail closed before user creation.
- Operator and Viewer defaults remain coarse starting points; explicit module assignments determine authorization.
- Replacing module entitlements changes the next server authorization decision.
- Administration mutations require an authenticated Administration/Admin entitlement even while compatibility mode is enabled.
- Primary navigation filters to assigned modules; page and API checks remain the actual security boundary.
- The disabled default preserves existing tailnet-only review access.

## Designer verification

- Settings visibly explains compatibility mode instead of presenting unusable access controls.
- The sign-in page has one heading, invite-only language, explicit configuration state, and safe internal callback handling.
- Desktop review at 1280px and phone review at 390×844 passed with document width equal to viewport width and no horizontal overflow.
- Authenticated invite/module mutation UI compiled and passed type/lint/build gates; live GitHub callback and membership mutation were not executed because no authorized OAuth credentials exist.

## Dependency security review

- Added Better Auth 1.6.25, which officially supports Next.js 16 and the built-in Node SQLite driver.
- Updated Next.js and `eslint-config-next` from 16.2.10 to 16.2.12, removing the reported direct Proxy-bypass, Server Action DoS/SSRF, cache, and endpoint-disclosure ranges fixed by that patch.
- Applied npm's reviewed non-breaking advisory updates for root PostCSS, nanoid, and brace-expansion packages.
- `npm audit --omit=dev` still reports three high-severity production advisories through Next's nested PostCSS and Sharp versions. npm offers only an invalid breaking downgrade to Next 9.3.3; no force fix was applied.

## Activation gates

Required mode must not be activated until:

1. The Product Owner supplies or explicitly authorizes creation of the private GitHub OAuth application, callback URL, client ID, and secret.
2. `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are stored outside Git.
3. The initial owner email is provided and `npm run auth:bootstrap-owner -- <email>` is executed.
4. The remaining Next/PostCSS/Sharp production advisories have a supported fix or receive explicit Product Owner risk acceptance.
5. Desktop and phone GitHub callback, invite acceptance, navigation filtering, mutation denial, logout, and session persistence are verified live.

## Negative-effect declaration

`PHRONESIS_AUTH_MODE` defaults to `DISABLED`; no production session, login requirement, GitHub account/application, credential, user, membership, invitation, deployment, public route, or external message was created. The local identity database is ignored and recoverable.
