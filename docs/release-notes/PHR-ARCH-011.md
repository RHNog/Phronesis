# PHR-ARCH-011 Release Notes

Phronesis now includes an invite-only, self-hosted identity and module-authorization foundation: database sessions, one workspace, Owner/Admin/Operator/Viewer roles, independent module assignments, server-side enforcement, audit records, and responsive sign-in/access-management surfaces.

The original release shipped inactive. As of 2026-08-06, the private runtime has a configured Better Auth origin/secret, one active Owner, and `OPTIONAL` compatibility mode. `PHR-ARCH-016` adds email/password identity so GitHub is no longer mandatory for required-mode readiness; promoting the whole private service to `REQUIRED` remains a separate owner rollout decision.
