# PHR Local Card Recognition — Chief Architect Conformance Review

## Review Status

`CONFORMS FOR PRODUCT REVIEW — CALIBRATION, CONSUMER ADOPTION, AND RELEASE GATES REMAIN CLOSED`

This is a same-session conformance review and is not represented as independent approval.

## Conformance

- Phronesis retains canonical identity, pricing, offer, operator, and export authority.
- Windows owns only acquisition and sealed transfer; the local Vision worker owns only derived recognition evidence.
- Originals are immutable and content-addressed; retries are idempotent and jobs recover after lease expiry.
- Multi-region geometry and append-only corrections preserve the original frame.
- Candidate evidence is deterministic and game-gated. Machine output defaults to review/abstention.
- Condition and finish are operator confirmed; exact-condition price evidence is read-only and server-revalidated.
- Recognized Asset Envelope v1 is canonical, hash-bound, duplicate/staleness checked, and publication-free.
- The TCGplayer/Liga adapters are pure draft transformations; no external repository was changed.

## Findings

The real Pokémon batch initially revealed a cross-game false-positive caused by the generic `BASIC` header. The pipeline correctly limited it to `REVIEW`, but that recommendation was still operationally poor. An explicit observed-game classifier now prevents unsupported Pokémon evidence from querying the Magic catalogue. Replay produced 18 safe abstentions.

No claim is made that OCR-only retrieval meets product accuracy. Apple Vision feature prints are generated and versioned, but the catalogue-scale artwork index remains disabled until source licensing/provenance and holdout gates are satisfied. Automatic binder segmentation is also not claimed; the implemented region contract and correction history are the safe extension foundation.

## Next Accountable Gate

Product Owner reviews the visible package. Auto-accept requires a separately approved corpus and powered English Magic holdout. TCGPLAYER Tools and Liga consumer adoption, deployment, push, and publication remain separate controlled changes.
