# PHR-TECH-017 — Cross-Platform Scanner Appliance Control Plane Conformance Review

Status: Control-plane foundation conforms; signed distribution and physical qualification gated.

- The implementation preserves `PHR-ARCH-015`: Phronesis owns workflow and evidence, the local agent owns vendor-driver execution, and recognition remains an isolated existing worker.
- Pairing, credential hashing, revocation, readiness, Start/Cancel lifecycle, exact session binding, front-only evidence admission, and idempotency satisfy the specification.
- Authorization boundaries fail closed: permanent Administration Admin is required for device administration, Vendor Workspace Operate for commands, and agent endpoints accept only the device bearer credential.
- Phronesis never sends executable paths, capture arguments, or shell input, and the appliance opens no listener.
- The reference agent is portable and natively packageable without runtime dependencies, but the implementation accurately distinguishes that control-plane portability from physical scanner and driver support.
- Existing manual bridge, recognition review, price/offer, purchasing, inventory, and publication boundaries remain unchanged.
- Automated, package, live migration, private runtime, and responsive browser evidence satisfy the implemented-foundation acceptance criteria.
- Signed installers, unattended background services, Windows artifact execution, auto-update, and per-combination physical qualification remain correctly withheld.

This is same-session Chief Architect conformance evidence, not independent security certification or Product Owner acceptance.
