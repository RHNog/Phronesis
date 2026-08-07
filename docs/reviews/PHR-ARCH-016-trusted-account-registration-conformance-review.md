# PHR-ARCH-016 Conformance Review

Status: Conforms — same-session review; Product Owner experience review remains authoritative.

- Identity creation and access assignment are separate operations.
- Pending accounts have zero memberships and fail protected authorization.
- Approval requires authenticated Administration Admin authority, a non-Owner role, a same-workspace request, and at least one valid explicit entitlement.
- Approval/rejection are transactional and auditable; stale decisions fail closed.
- Invitation, event-worker, existing-member, and navigation regressions remain green.
- The pending page, Settings queue, account menu, logout, and phone/desktop behavior satisfy the feature acceptance criteria.
- Email verification and recovery are accurately disclosed as residual security work.

This review is not an independent approval because architecture, implementation, and conformance were performed in one session.

## 2026-08-06 Sign Up Invite Revision

The revision conforms. The shared URL is a navigation convenience rather than an authorization artifact: it carries no secret or access decision and terminates in the existing zero-membership registration lifecycle. Copy reuses the resilient browser boundary, Share uses the browser capability only after hydration, and Preview is an ordinary visible link.

The public-origin activation guard also conforms to `PHR-TECH-016`. Merely trusting a future auth origin cannot cause Phronesis to advertise an unreachable public hostname; explicit enabled mode is required after infrastructure verification. Private owner access and every server authorization gate are unchanged.

## 2026-08-07 No-Client Public Activation

The architecture remains conformant after public activation. The verified Funnel origin is advertised only because public mode is enabled; ordinary visitors need no Tailscale client. Registration still produces zero membership, pending users remain outside protected modules, and approved users receive only exact owner-assigned entitlements. `PHR-TECH-016` retains the transport boundary and the branded-domain gate.
